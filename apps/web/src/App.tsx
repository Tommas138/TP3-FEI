import { Route, Routes } from 'react-router-dom';
import { Catalogo } from './Catalogo';
import { ImportarPadronPage } from './pages/ImportarPadronPage';
import { IngresoPage } from './pages/IngresoPage';
import { InicioPage } from './pages/InicioPage';
import { LandingPage } from './pages/LandingPage';
import { NuevoTorneoPage } from './pages/NuevoTorneoPage';
import { PadronPage } from './pages/PadronPage';
import { RecuperarContrasenaPage } from './pages/RecuperarContrasenaPage';
import { RegistroPage } from './pages/RegistroPage';
import { RestablecerContrasenaPage } from './pages/RestablecerContrasenaPage';
import { SorteoPage } from './pages/SorteoPage';
import { TuCircuitoPage } from './pages/TuCircuitoPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/ingresar" element={<IngresoPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />
      <Route path="/inicio" element={<InicioPage />} />
      <Route path="/circuito" element={<TuCircuitoPage />} />
      <Route path="/padron" element={<PadronPage />} />
      <Route path="/padron/importar" element={<ImportarPadronPage />} />
      {/* /torneos/nuevo entra por acá con id "nuevo": es la misma pantalla antes del primer guardado. */}
      <Route path="/torneos/:id" element={<NuevoTorneoPage />} />
      <Route path="/torneos/:id/sorteo" element={<SorteoPage />} />
    </Routes>
  );
}
