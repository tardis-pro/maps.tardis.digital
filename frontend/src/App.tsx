import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from './bits/Signin';
import Signup from './bits/Signup';
import ResetPassword from './bits/PasswordChange';
import Home from './bits/Home';

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='signin' element={<Signin />} />
                <Route path='signup' element={<Signup />} />
                <Route path='resetpassword' element={<ResetPassword />} />
                <Route path='/' element={<Home />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;