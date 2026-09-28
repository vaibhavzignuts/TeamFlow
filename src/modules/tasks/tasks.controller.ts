import { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";
import { tasksService } from "./tasks.service";

export const tasksController = {
  async create(req: Request, res: Response) {
    const task = await tasksService.create(req.params.projectId, req.userId!, req.body);
    res.status(201).json({ success: true, data: task });
  },

  async list(req: Request, res: Response) {
    const { status, assigneeId, page, pageSize } = req.query as Record<string, string | undefined>;
    const result = await tasksService.list(req.params.projectId, {
      status: status as TaskStatus | undefined,
      assigneeId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response) {
    const task = await tasksService.getById(req.params.taskId);
    res.status(200).json({ success: true, data: task });
  },
  async update(req: Request, res: Response) {
    const task = await tasksService.update(req.params.taskId, req.body);
    res.status(200).json({ success: true, data: task });
  },
  async assign(req: Request, res: Response) {
    const task = await tasksService.assign(req.params.taskId, req.body.assigneeId);
    res.status(200).json({ success: true, data: task });
  },
  async changeStatus(req: Request, res: Response) {
    const task = await tasksService.changeStatus(req.params.taskId, req.body.status);
    res.status(200).json({ success: true, data: task });
  },
  async remove(req: Request, res: Response) {
    await tasksService.remove(req.params.taskId);
    res.status(200).json({ success: true, message: "Task deleted" });
  },
};