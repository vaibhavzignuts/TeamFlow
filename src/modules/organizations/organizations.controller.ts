import { Request, Response } from "express";
import { organizationsService } from "./organizations.service";

export const organizationsController = {
  async create(req: Request, res: Response) {
    const org = await organizationsService.create(req.userId!, req.body.name);
    res.status(201).json({ success: true, data: org });
  },
  async listMine(req: Request, res: Response) {
    const orgs = await organizationsService.listForUser(req.userId!);
    res.status(200).json({ success: true, data: orgs });
  },
  async getById(req: Request, res: Response) {
    const org = await organizationsService.getById(req.params.orgId);
    res.status(200).json({ success: true, data: org });
  },
  async update(req: Request, res: Response) {
    const org = await organizationsService.update(req.params.orgId, req.body);
    res.status(200).json({ success: true, data: org });
  },
  async remove(req: Request, res: Response) {
    await organizationsService.delete(req.params.orgId);
    res.status(200).json({ success: true, message: "Organization deleted" });
  },
  async addMember(req: Request, res: Response) {
    const member = await organizationsService.addMember(req.params.orgId, req.body.userId, req.body.role);
    res.status(201).json({ success: true, data: member });
  },
  async removeMember(req: Request, res: Response) {
    await organizationsService.removeMember(req.params.orgId, req.params.memberId);
    res.status(200).json({ success: true, message: "Member removed" });
  },
  async updateMemberRole(req: Request, res: Response) {
    const member = await organizationsService.updateMemberRole(req.params.orgId, req.params.memberId, req.body.role);
    res.status(200).json({ success: true, data: member });
  },
};