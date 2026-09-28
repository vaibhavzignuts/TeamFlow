import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes";
import organizationsRoutes from "./modules/organizations/organizations.routes";
import { projectsNestedRouter, projectsStandaloneRouter } from "./modules/projects/projects.routes";
import { tasksNestedRouter, tasksStandaloneRouter } from "./modules/tasks/tasks.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());        // safe HTTP headers
app.use(cors());          // restrict to your frontend origin in production
app.use(express.json());  // parses JSON bodies into req.body
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined")); // request logging

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

const API = "/api/v1";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/organizations`, organizationsRoutes);
app.use(`${API}/organizations/:orgId/projects`, projectsNestedRouter);
app.use(`${API}/projects`, projectsStandaloneRouter);
app.use(`${API}/projects/:projectId/tasks`, tasksNestedRouter);
app.use(`${API}/tasks`, tasksStandaloneRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorMiddleware); // must be last