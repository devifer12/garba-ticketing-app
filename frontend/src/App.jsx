import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ErrorNotification from './components/common/ErrorNotification';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:role" element={<Dashboard />} />
      </Routes>
      
      {/* Global Error Notification */}
      <ErrorNotification />
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155'
        }}
      />
    </BrowserRouter>
  );
}

export default App;