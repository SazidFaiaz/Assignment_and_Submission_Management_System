import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  name: string;
  department: string;
  term: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    term: { type: String, required: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>('Course', courseSchema);
