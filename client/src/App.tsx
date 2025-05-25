import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import VisualizationDetail from "@/pages/VisualizationDetail";
import Shared from "@/pages/Shared";
import StaticReport from "@/pages/StaticReport";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={Projects} />
      <Route path="/visualization/:id" component={VisualizationDetail} />
      <Route path="/share/:shareId" component={Shared} />
      <Route path="/report/:shareId" component={StaticReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export default App;
