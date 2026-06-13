import MainRouter from "./routes/MainRouter";
import { ToastAlert } from "./components/common/alerts/ToastAlert";

function App() {
  return (
    <>
      <ToastAlert />
      <MainRouter />
    </>
  );
}

export default App;
