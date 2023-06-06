import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signin from './bits/Signin';
import Signup from './bits/Signup';
import ResetPassword from './bits/PasswordChange';

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Signin />} />
                <Route path='signup' element={<Signup />} />
                <Route path='resetpassword' element={<ResetPassword />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;