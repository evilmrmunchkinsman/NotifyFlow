import app from './app';
import './modules/delivery/delivery.worker'; 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[notifyflow] server listening on :${PORT}`);
});