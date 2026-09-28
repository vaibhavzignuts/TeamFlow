import { Request, Response } from "express";
import { projectsService } from "./projects.service";

export const projectsController = {
  async create(req: Request, res: Response) {
    const project = await projectsService.create(req.params.orgId, req.body.name, req.body.description);
    res.status(201).json({ success: true, data: project });
  },
  async listForOrg(req: Request, res: Response) {
    const projects = await projectsService.listForOrg(req.params.orgId);
    res.status(200).json({ success: true, data: projects });
  },
  async getById(req: Request, res: Response) {
    const project = await projectsService.getById(req.params.projectId);
    res.status(200).json({ success: true, data: project });
  },
  async update(req: Request, res: Response) {
    const project = await projectsService.update(req.params.projectId, req.body);
    res.status(200).json({ success: true, data: project });
  },
  async archive(req: Request, res: Response) {
    const project = await projectsService.archive(req.params.projectId);
    res.status(200).json({ success: true, data: project });
  },
  async restore(req: Request, res: Response) {
    const project = await projectsService.restore(req.params.projectId);
    res.status(200).json({ success: true, data: project });
  },
  async remove(req: Request, res: Response) {
    await projectsService.remove(req.params.projectId);
    res.status(200).json({ success: true, message: "Project deleted" });
  },
};