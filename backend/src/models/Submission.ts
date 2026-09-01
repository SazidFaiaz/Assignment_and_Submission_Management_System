import mongoose, { Schema, Document, Types } from 'mongoose';

export type SubmissionStatus = 'submitted' | 'late' | 'graded' | 'returned';

export interface ISubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  answer: string;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  submittedAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    answer: { type: String, required: true },
    status: { type: String, enum: ['submitted', 'late', 'graded', 'returned'], default: 'submitted' },
    marks: { type: Number, default: null },
    feedback: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure unique submission per student per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
