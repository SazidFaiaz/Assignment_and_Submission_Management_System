import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourseMember extends Document {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  memberRole: 'teacher' | 'student';
  createdAt: Date;
}

const courseMemberSchema = new Schema<ICourseMember>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    memberRole: { type: String, enum: ['teacher', 'student'], required: true },
  },
  { timestamps: true }
);

// Ensure unique course membership
courseMemberSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const CourseMember = mongoose.model<ICourseMember>('CourseMember', courseMemberSchema);
