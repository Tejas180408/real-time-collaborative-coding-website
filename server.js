import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatHistory = new Map(); // roomId -> array of messages

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const tempDir = path.join(__dirname, "temp");
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const promptsLog = path.join(logsDir, "prompts.log");
const inputsLog = path.join(logsDir, "inputs.log");
const outputsLog = path.join(logsDir, "outputs.log");

const logToFile = (filePath, data) =>
  fs.appendFileSync(filePath, data + "\n", "utf8");

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;
  let subprocess = null;
  let isWaitingForInput = false;
  let outputBuffer = "";

  socket.on(
    "join",
    ({ roomId, userName, fileId, folder, file, hostId, micOn }) => {
      console.log(
        `Joining Room: ${roomId}, User: ${userName}, File: ${fileId}`
      );
      console.log("✅ Clients in room:", roomId, [...io.sockets.adapter.rooms.get(roomId) || []]);

      if (currentRoom) {
        socket.leave(currentRoom);
        const room = rooms.get(currentRoom);
        if (room) {
          room.users.delete(socket.id);
          io.to(currentRoom).emit(
            "userJoined",
            Array.from(room.users.values())
          );
        }
      }

      currentRoom = roomId;
      currentUser = userName;
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          hostId, // ✅ persistent host identity
          hostSocketId: socket.id, // helpful for targeting messages
          users: new Map(),
          codeByFileId: new Map(),
          folders: [],
          files: new Map(),
          currentFolder: null,
          currentFileId: null,
        });
      }

      const room = rooms.get(roomId);
      room.users.set(socket.id, { name: userName, hostId, micOn });

      // Only allow the first client to set folder or if current is not set
      if (folder) {
        room.currentFolder = folder;
        room.folders = [folder];

        if (folder?.files?.length) {
          folder.files.forEach((f) => {
            room.files.set(f.id, f);
            if (f.id === fileId) {
              room.codeByFileId.set(f.id, f.code);
            }
          });
        }

        // Store file too
        if (file && fileId) {
          room.files.set(fileId, file);
          room.currentFileId = fileId;
        }

        const folders = room.folders;
        const files = Array.from(room.files.values()).map((f) => {
          const parentFolder = folders.find((fold) =>
            fold.file.some((file) => file.id === f.id)
          );
          return { ...f, folderId: parentFolder?.id || null }; // include folderId
        });

        io.to(roomId).emit("folderData", {
          folders,
          files,
          hostId: room.hostId, // ✅ Add this
          currentFileId: room.currentFileId, // 👈 Add this
        });

        console.log("📁 Broadcasting folder to all clients in room:", roomId);
      }

      // ✅ Only set code if it doesn't already exist for that file
      if (fileId && file?.code && !room.codeByFileId.has(fileId)) {
        room.codeByFileId.set(fileId, file.code);
        room.files.set(fileId, { ...file, code: file.code }); // ✅ Ensure code is included!
      }

      const allFolders = room.folders;
      const allFiles = Array.from(room.files.values());

      if (socket.id !== room.hostId) {
        socket.emit("folderData", {
          folders: allFolders,
          files: allFiles,
          hostId: room.hostId,
        });
      }

      const clients = Array.from(room.users).map(([socketId, userObj]) => ({
        socketId,
        name: userObj.name,
        hostId: userObj.hostId,
        micOn: userObj.micOn,
      }));

      io.to(roomId).emit("userJoined", clients);

      // ✅ Send the latest code to the newly joined client
      const code = room.codeByFileId.get(fileId) || "";
      console.log("✅ Emitting codeUpdate to client:", fileId, code);
      socket.emit("codeUpdate", { roomId, fileId, code });

      if (chatHistory.has(roomId)) {
        socket.emit("chatHistory", chatHistory.get(roomId));
      }
    }
  );

  socket.on("folderSelected", ({ roomId, folderId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentFolder = folderId;
      io.to(roomId).emit("folderChanged", { folderId });

      // Also re-broadcast folder + files
      const folder = room.folders.find((f) => f.id === folderId);
      if (folder) {
        io.to(roomId).emit("folderData", {
          folders: room.folders,
          files: Array.from(room.files.values()),
          hostId: room.hostId, // ✅ Add this
          currentFileId: room.currentFileId, // 👈 Add this
        });
      }
    }
  });

  socket.on("fileSelected", ({ roomId, fileId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentFileId = fileId;
      io.to(roomId).emit("fileChanged", { fileId });

      const code = room.codeByFileId.get(fileId) || "";
      io.to(roomId).emit("codeUpdate", { roomId, fileId, code });
    }
  });

  socket.on("broadcastFolderData", ({ roomId, folders, files, hostId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (hostId !== room.hostId) {
      console.warn("⛔ Non-host tried to broadcast folder data");
      return;
    }

    const validFolders = folders.filter((f) => f?.id && f?.title);

    // Ensure files are attached to folders
    validFolders.forEach((folder) => {
      folder.files = files.filter((file) => file.folderId === folder.id);
    });

    room.folders = validFolders;
    const folder = validFolders[0];
    room.currentFolder = folder;

    if (folder?.files?.length) {
      folder.files.forEach((f) => {
        room.files.set(f.id, f);
        room.codeByFileId.set(f.id, f.code || "");
      });
    }

    if (files?.length) {
      files.forEach((f) => {
        room.files.set(f.id, f);
        room.codeByFileId.set(f.id, f.code || "");
      });
    }

    io.to(roomId).emit("folderData", {
      folders: room.folders,
      files: Array.from(room.files.values()),
      hostId: room.hostId,
    });
  });

  socket.on("codeChange", ({ roomId, fileId, code }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Only accept codeChange if fileId matches current opened file
    if (fileId !== room.currentFileId) {
      console.warn(`⚠️ Code change rejected for wrong file ${fileId}`);
      return;
    }

    room.codeByFileId.set(fileId, code);
    socket.to(roomId).emit("codeUpdate", { roomId, fileId, code });
  });

  socket.on("codeChange", ({ roomId, fileId, code, cursor }) => {
    console.log("📝 Code changed:", { roomId, fileId, code });
    const room = rooms.get(roomId);
    if (!room) return;

    // Only accept codeChange if fileId matches current opened file
    if (fileId !== room.currentFileId) {
      console.warn(`⚠️ Code change rejected for wrong file ${fileId}`);
      return;
    }

    console.log("🧠 Storing code for", fileId, ":", code);
    room.codeByFileId.set(fileId, code);
    socket.to(roomId).emit("codeUpdate", { roomId, fileId, code, cursor });
  });

  socket.on("saveCode", ({ roomId, fileId, code }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    console.log(`💾 Save Code Broadcast: file ${fileId}`);

    room.codeByFileId.set(fileId, code);
    io.to(roomId).emit("savedCode", { fileId, code });
  });

  socket.on("clearOutput", ({ roomId }) => {
    io.to(roomId).emit("clearOutput"); // 🔥 Broadcast to all
  });

  socket.on("runCode", async ({ roomId, code, language, isCommonJS }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (subprocess) {
      subprocess.kill("SIGKILL");
      subprocess = null;
      isWaitingForInput = false;
    }

    const extensions = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
      php: "php",
      cpp: "cpp",
    };

    let fileExt =
      language === "javascript" && isCommonJS ? "cjs" : extensions[language];
    if (!fileExt) {
      io.to(roomId).emit("codeOutput", { output: "Unsupported language." });
      return;
    }

    let fileName = `temp_code.${fileExt}`;
    let filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code, "utf8");

    let command, args;

    try {
      switch (language) {
        case "javascript":
          command = "node";
          args = [filePath];
          break;
        case "typescript":
          command = "npx";
          args = ["ts-node", filePath];
          break;
        case "python":
          command = "python";
          args = ["-u", filePath];
          break;
        case "java":
          const className = code.match(/public\s+class\s+(\w+)/)?.[1] || "Main";
          fileName = `${className}.java`;
          filePath = path.join(tempDir, fileName);
          fs.writeFileSync(filePath, code);
          await new Promise((res, rej) => {
            const compile = spawn("javac", ["-d", tempDir, filePath]);
            compile.on("close", (code) =>
              code === 0 ? res() : rej("Java compile failed")
            );
          });
          command = "java";
          args = ["-cp", tempDir, className];
          break;
        case "csharp":
          const exeFile = filePath.replace(".cs", ".exe");
          await new Promise((res, rej) => {
            const compile = spawn("csc", ["/out:" + exeFile, filePath]);
            compile.on("close", (code) =>
              code === 0 ? res() : rej("C# compile failed")
            );
          });
          command = exeFile;
          args = [];
          break;
        case "php":
          command = "php";
          args = [filePath];
          break;
        case "cpp":
          const cppExe = path.join(tempDir, "temp_code.exe");
          await new Promise((res, rej) => {
            const compile = spawn("g++", ["-o", cppExe, filePath]);
            compile.on("close", (code) =>
              code === 0 ? res() : rej("C++ compile failed")
            );
          });
          command = cppExe;
          args = [];
          break;
        default:
          throw new Error("Unsupported language.");
      }

      subprocess = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

      subprocess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log("📤 Emitting Output:", output);

        const isPrompt =
          /[:?]$|[:?]\s*$|[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]$/.test(
            output
          );

        if (isPrompt) {
          isWaitingForInput = true;
          logToFile(promptsLog, output);
          io.to(roomId).emit("codeOutput", {
            output,
            waitingForInput: true,
          });
        } else {
          logToFile(outputsLog, output);
          io.to(roomId).emit("codeOutput", {
            output,
            waitingForInput: false,
          });
        }
      });

      subprocess.stderr.on("data", (err) => {
        io.to(roomId).emit("codeOutput", {
          output: "Error: " + err.toString(),
        });
      });

      subprocess.on("close", () => {
        isWaitingForInput = false;
        subprocess = null;

        io.to(roomId).emit("codeOutput", {
          output: "Execution finished.",
          waitingForInput: false,
        });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    } catch (error) {
      io.to(roomId).emit("codeOutput", { output: error.toString() });
    }
  });

  socket.on("codeInput", ({ roomId, input }) => {
    if (subprocess && isWaitingForInput) {
      logToFile(inputsLog, input.trim());
      subprocess.stdin.write(input + "\n");
    }
  });

  socket.on("syncInput", ({ roomId, input }) => {
    socket.to(roomId).emit("syncInput", { input, sender: socket.id });
  });

  socket.on("inputEcho", ({ roomId, input, sender }) => {
    socket.to(roomId).emit("inputEcho", { input, sender });
  });

  socket.on("toggleMic", ({ roomId, micOn }) => {
    const clients = rooms.get(roomId)?.clients || [];

    // Update client's mic state
    clients.forEach((client) => {
      if (client.socketId === socket.id) {
        client.micOn = micOn;
      }
    });

    // Broadcast new mic state to everyone
    io.to(roomId).emit("micStatusUpdate", {
      socketId: socket.id,
      micOn,
    });
  });

  socket.on("webrtc-offer", ({ to, sdp }) => {
    io.to(to).emit("webrtc-offer", { from: socket.id, sdp });
  });

  socket.on("webrtc-answer", ({ to, sdp }) => {
    io.to(to).emit("webrtc-answer", { from: socket.id, sdp });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
  });

  socket.on("chatMessage", ({ roomId, userName, message, time }) => {
    const msg = { userName, message, time };
    if (!chatHistory.has(roomId)) chatHistory.set(roomId, []);
    chatHistory.get(roomId).push(msg);
    console.log("📨 Broadcasting to room:", roomId, msg); // <-- ADD THIS
    io.to(roomId).emit("chatMessage", msg);
  });  

  socket.on("chatFile", (data) => {
    io.to(data.roomId).emit("chatFile", data);
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);

      if (room && room.users.has(socket.id)) {
        room.users.delete(socket.id);

        const updatedClients = Array.from(room.users).map(
          ([socketId, userObj]) => ({
            socketId,
            name: userObj.name,
            hostId: userObj.hostId,
            micOn: userObj.micOn,
          })
        );

        io.to(currentRoom).emit("userJoined", updatedClients);

        // Optional: clean up if room is empty
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }
  });

  socket.on("endMeeting", ({ roomId }) => {
    console.log("📢 Meeting ended in room:", roomId);

    const room = rooms.get(roomId);
    if (room) {
      io.to(roomId).emit("endMeeting"); // 🔁 Notify all clients
      rooms.delete(roomId); // 🧼 Clean up server state
    }
  });
});

const PORT = process.env.PORT || 5000;
// const wss = new WebSocketServer({ port: PORT });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

{
  /*
console.log(`WebSocket server running on port ${PORT}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, "temp");
const logsDir = path.join(__dirname, "logs");

// Ensure temp and logs directories exist
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Log file paths
const promptsLog = path.join(logsDir, "prompts.log");
const inputsLog = path.join(logsDir, "inputs.log");
const outputsLog = path.join(logsDir, "outputs.log");

// Function to append data to a file
const logToFile = (filePath, data) => {
  fs.appendFileSync(filePath, data + "\n", "utf8");
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  let subprocess = null;
  let isWaitingForInput = false;
  let outputBuffer = "";

  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    if (data.input && subprocess) {
      const userInput = data.input.trim();
      console.log("✏️ Received Input:", userInput);
      logToFile(inputsLog, userInput);

      // Write user input to the running subprocess
      subprocess.stdin.write(userInput + "\n");

      
    } else {
      console.warn("⚠️ No input received, ignoring...");
    }

    // Kill any previous process
    if (data.code && data.language) {
      if (subprocess) {
        subprocess.kill("SIGKILL");
        subprocess = null;
        isWaitingForInput = false;
      }
    }

    if (data.code && data.language) {
      isWaitingForInput = false;
      outputBuffer = "";
      const { language, code } = data;

      const extensions = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        java: "java",
        csharp: "cs",
        php: "php",
        cpp: "cpp", // ✅ C++ Support Added
      };

      const fileExt =
        language === "javascript"
          ? data.isCommonJS
            ? "cjs"
            : "js"
          : extensions[language];

      if (!fileExt) {
        ws.send(JSON.stringify({ output: "Unsupported language." }));
        return;
      }

      let fileName = `temp_code.${fileExt}`;
      let filePath = path.join(tempDir, fileName);
      try {
        fs.writeFileSync(filePath, code, "utf8");
      } catch (error) {
        console.error("❌ Error writing file:", error);
        ws.send(JSON.stringify({ output: "Error writing file. Try again." }));
        return;
      }

      let command, args;

      switch (language) {
        case "javascript":
          command = "node";
          args = [filePath];
          break;
        case "typescript":
          command = "npx";
          args = ["ts-node", filePath];
          break;
        case "python":
          command = "python";
          args = ["-u", filePath]; // -u: unbuffered output
          break;
        case "java":
          const javaClassMatch = code.match(/public\s+class\s+(\w+)/);
          const javaClassName = javaClassMatch ? javaClassMatch[1] : "Main";

          fileName = `${javaClassName}.java`;
          filePath = path.join(tempDir, fileName);
          fs.writeFileSync(filePath, code);

          const compile = spawn("javac", ["-d", tempDir, filePath]);
          await new Promise((resolve, reject) => {
            compile.on("close", (code) =>
              code === 0
                ? resolve()
                : reject(new Error("Java compilation failed."))
            );
          });

          command = "java";
          args = ["-cp", tempDir, javaClassName];
          break;
        case "csharp":
          const exeFile = filePath.replace(".cs", ".exe");
          await new Promise((resolve, reject) => {
            const compile = spawn("csc", ["/out:" + exeFile, filePath]);
            compile.on("close", (code) =>
              code === 0
                ? resolve()
                : reject(new Error("C# compilation failed."))
            );
          });
          command = exeFile;
          args = [];
          break;
        case "php":
          command = "php";
          args = [filePath];
          break;
        case "cpp": // ✅ Added C++ Support
          fileName = "temp_code.cpp";
          filePath = path.join(tempDir, fileName);
          fs.writeFileSync(filePath, code);

          const cppExeFile = path.join(tempDir, "temp_code.exe");

          try {
            await new Promise((resolve, reject) => {
              const compile = spawn("g++", ["-o", cppExeFile, filePath]);
              compile.on("close", (code) =>
                code === 0 ? resolve() : reject(new Error("C++ compilation failed."))
              );
            });
          } catch (error) {
            ws.send(JSON.stringify({ output: "C++ compilation failed." }));
            return;
          }

          command = cppExeFile;
          args = [];
          break;
        default:
          ws.send(JSON.stringify({ output: "Unsupported language." }));
          return;
      }

      subprocess = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

      subprocess.stdout.on("data", (output) => {
        const text = output.toString();
        outputBuffer += text;
        console.log("📤 Output Received:", text.trim());

        logToFile(outputsLog, text.trim());

        const inputPromptDetected =
          /[a-zA-Z0-9!@#$%^&*()_+=\-[\]{};:'",.<>?/|\\`~]/.test(text.trim());

        if (inputPromptDetected) {
          isWaitingForInput = true;
          logToFile(promptsLog, text.trim());
          ws.send(
            JSON.stringify({ output: outputBuffer, waitingForInput: true })
          );
        } else {
          isWaitingForInput = false;
          ws.send(
            JSON.stringify({
              output: outputBuffer || "",
              waitingForInput: false,
            })
          );
        }

        outputBuffer = ""; 
      });

      subprocess.stderr.on("data", (error) => {
        ws.send(JSON.stringify({ output: "Error: " + error.toString() }));
      });

      subprocess.on("close", () => {
        isWaitingForInput = false;
        subprocess = null;

        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("❌ Cleanup error:", err);
          }
        }

        ws.send(JSON.stringify({ output: "\n", waitingForInput: false }));
        ws.send(JSON.stringify({ output: "Execution finished.", waitingForInput: false }));

        try {
          if (language === "java") {
            const classFile = path.join(tempDir, `${fileName.replace(".java", ".class")}`);
            if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
          }
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (subprocess) subprocess.kill();
  });

  ws.on("error", (err) => console.error("WebSocket error:", err));
});

*/
}
