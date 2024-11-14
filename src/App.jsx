import { Outlet } from 'react-router-dom';
import './App.css'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <div>
        <Toaster
          position="top-right"
          reverseOrder={true}
          toastOptions={{
            success: {
              theme: {
                primary: 'green'
              }
            }
          }}>
        </Toaster>
      </div>
      <div>
        <Outlet/>
      </div>
    </>
  );
}

export default App;
