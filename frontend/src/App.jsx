import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './assets/Toast.jsx';
import CartPage from './Components/CartPage.jsx';
import ItemPage from './Components/ItemPage.jsx';
import LoginPage from './Components/LoginPage.jsx';
import MainPage from './Components/MainPage.jsx';
import ProfilePage from './Components/ProfilePage.jsx';
import OrderPage from './Components/OrderPage.jsx';
import SearchPage from './Components/SearchPage.jsx';

function App() {
  return (
    <ToastProvider>
      
        <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/item" element={<ItemPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
      
    </ToastProvider>
  );
}

export default App;
