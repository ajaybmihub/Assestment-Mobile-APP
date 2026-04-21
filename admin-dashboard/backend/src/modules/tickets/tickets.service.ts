import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from './ticket.schema';

@Injectable()
export class TicketsService {
  constructor(@InjectModel(Ticket.name) private ticketModel: Model<Ticket>) {}

  async create(data: any): Promise<Ticket> {
    console.log("BACKEND: Creating ticket with data:", JSON.stringify(data, null, 2));
    try {
      const ticket = new this.ticketModel({
        ...data,
        activity_log: [{
          status: 'open',
          timestamp: new Date(),
          message: 'Ticket created'
        }]
      });
      const saved = await ticket.save();
      console.log("BACKEND: Ticket saved successfully:", saved._id);
      return saved;
    } catch (error) {
      console.error("BACKEND ERROR: Failed to save ticket:", error);
      throw error;
    }
  }

  async findAll(): Promise<{ tickets: Ticket[]; total: number }> {
    const tickets = await this.ticketModel.find().sort({ createdAt: -1 }).exec();
    const total = await this.ticketModel.countDocuments().exec();
    return { tickets, total };
  }

  async findOne(id: string): Promise<Ticket | null> {
    return this.ticketModel.findById(id).exec();
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<Ticket | null> {
    return this.ticketModel.findByIdAndUpdate(
      id,
      { 
        $set: { status, resolution_notes: notes },
        $push: { 
          activity_log: { 
            status, 
            timestamp: new Date(), 
            message: `Status updated to ${status}${notes ? ': ' + notes : ''}` 
          } 
        } 
      },
      { new: true }
    ).exec();
  }

  async findByUser(userId: string): Promise<Ticket[]> {
    return this.ticketModel.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
  }
}
