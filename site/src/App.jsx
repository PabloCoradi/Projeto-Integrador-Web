import { Navigate, Route, Routes } from 'react-router-dom';
import ControleRolagem from './components/ControleRolagem';
import BotaoWhatsapp from './components/BotaoWhatsapp';
import Inicio from './pages/Inicio';
import AreasDeAtuacao from './pages/AreasDeAtuacao';

export default function App() {
  return (
    <>
      <ControleRolagem />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/areas-de-atuacao" element={<AreasDeAtuacao />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BotaoWhatsapp />
    </>
  );
}
