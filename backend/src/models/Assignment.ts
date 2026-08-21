import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  courseId: Types.ObjectId;
  teacherId: Types.ObjectId;
  title: string;
  description: string;
  deadline: Date;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, required: true, default: 100 },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
