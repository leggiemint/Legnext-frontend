import mongoose, { Schema } from "mongoose";

export interface WebhookEventDoc extends mongoose.Document {
  provider: "stripe" | "square";
  eventId: string;
  eventType: string;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<WebhookEventDoc>(
  {
    provider: { type: String, enum: ["stripe", "square"], required: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WebhookEventSchema.index({ provider: 1, eventId: 1, eventType: 1 }, { unique: true });

export default (mongoose.models.WebhookEvent as mongoose.Model<WebhookEventDoc>) ||
  mongoose.model<WebhookEventDoc>("WebhookEvent", WebhookEventSchema);


