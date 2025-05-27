REM Crear carpetas principales
mkdir src
cd src
mkdir components pages routes services hooks utils

REM Crear subcarpetas para los componentes
cd components
mkdir admin estudiante vista qr
cd ..

REM Crear archivos base en /pages
cd pages
echo const AdminPage = () => <div>Admin Page</div>; export default AdminPage; > AdminPage.jsx
echo const EstudiantePage = () => <div>Estudiante Page</div>; export default EstudiantePage; > EstudiantePage.jsx
echo const VistaPage = () => <div>Vista Page</div>; export default VistaPage; > VistaPage.jsx
echo const QRPage = () => <div>QR Page</div>; export default QRPage; > QRPage.jsx
cd ..

REM Crear archivo de rutas
cd routes
echo import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; > AppRouter.jsx
echo import AdminPage from '../pages/AdminPage'; >> AppRouter.jsx
echo import EstudiantePage from '../pages/EstudiantePage'; >> AppRouter.jsx
echo import VistaPage from '../pages/VistaPage'; >> AppRouter.jsx
echo import QRPage from '../pages/QRPage'; >> AppRouter.jsx
echo. >> AppRouter.jsx
echo const AppRouter = () => ( >> AppRouter.jsx
echo   <Router> >> AppRouter.jsx
echo     <Routes> >> AppRouter.jsx
echo       <Route path="/admin" element={<AdminPage />} /> >> AppRouter.jsx
echo       <Route path="/estudiante" element={<EstudiantePage />} /> >> AppRouter.jsx
echo       <Route path="/vista" element={<VistaPage />} /> >> AppRouter.jsx
echo       <Route path="/qr" element={<QRPage />} /> >> AppRouter.jsx
echo     </Routes> >> AppRouter.jsx
echo   </Router> >> AppRouter.jsx
echo ); >> AppRouter.jsx
echo. >> AppRouter.jsx
echo export default AppRouter; >> AppRouter.jsx
cd ..

REM Crear archivos principales App.jsx y main.jsx
echo import AppRouter from './routes/AppRouter'; > App.jsx
echo. >> App.jsx
echo function App() { >> App.jsx
echo   return <AppRouter />; >> App.jsx
echo } >> App.jsx
echo. >> App.jsx
echo export default App; >> App.jsx

echo import React from 'react'; > main.jsx
echo import ReactDOM from 'react-dom/client'; >> main.jsx
echo import App from './App'; >> main.jsx
echo. >> main.jsx
echo ReactDOM.createRoot(document.getElementById('root')).render( >> main.jsx
echo   <React.StrictMode> >> main.jsx
echo     <App /> >> main.jsx
echo   </React.StrictMode> >> main.jsx
echo ); >> main.jsx

REM Crear archivos vacíos para mantener estructura en git
cd components\admin
echo. > .gitkeep
cd ..\estudiante
echo. > .gitkeep
cd ..\vista
echo. > .gitkeep
cd ..\qr
echo. > .gitkeep
cd ..\..\services
echo. > .gitkeep
cd ..\hooks
echo. > .gitkeep
cd ..\utils
echo. > .gitkeep

cd ..\..
echo Proyecto frontend base creado con éxito.