import { Navigate, Route, Routes } from 'react-router-dom';
import ControleRolagem from './components/ControleRolagem';
import BotaoWhatsapp from './components/BotaoWhatsapp';
import Inicio from './pages/Inicio';
import AreasDeAtuacao from './pages/AreasDeAtuacao';
import QuemSomos from './pages/QuemSomos';
import Noticias from './pages/Noticias';
import Noticia from './pages/Noticia';
import PerguntasFrequentes from './pages/PerguntasFrequentes';

export default function App() {
  return (
    <>
      <ControleRolagem />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/areas-de-atuacao" element={<AreasDeAtuacao />} />
        <Route path="/quem-somos" element={<QuemSomos />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/noticias/:slug" element={<Noticia />} />
        <Route path="/perguntas-frequentes" element={<PerguntasFrequentes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BotaoWhatsapp />
    </>
  );
}
