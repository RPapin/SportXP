import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ActivityLike } from '../database/entities/activity-like.entity';
import { ActivityComment } from '../database/entities/activity-comment.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(ActivityLike) private likeRepo: Repository<ActivityLike>,
    @InjectRepository(ActivityComment) private commentRepo: Repository<ActivityComment>,
  ) {}

  async toggleLike(activityId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const existing = await this.likeRepo.findOne({ where: { activityId, userId } });
    if (existing) {
      await this.likeRepo.delete({ activityId, userId });
    } else {
      await this.likeRepo.save(this.likeRepo.create({ activityId, userId }));
    }
    const count = await this.likeRepo.count({ where: { activityId } });
    return { liked: !existing, count };
  }

  async getComments(activityId: string) {
    const comments = await this.commentRepo.find({
      where: { activityId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    return comments.map(c => this.formatComment(c));
  }

  async addComment(activityId: string, userId: string, content: string) {
    if (!content?.trim()) throw new BadRequestException('Content required');
    const saved = await this.commentRepo.save(
      this.commentRepo.create({ activityId, userId, content: content.trim() }),
    );
    const full = await this.commentRepo.findOne({ where: { id: saved.id }, relations: { user: true } });
    return this.formatComment(full!);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException();
    await this.commentRepo.delete(commentId);
    return { deleted: true };
  }

  async getFeedMeta(activityIds: string[], userId?: string): Promise<Map<string, { likesCount: number; commentsCount: number; likedByMe: boolean }>> {
    if (!activityIds.length) return new Map();

    const [likes, commentCounts] = await Promise.all([
      this.likeRepo.find({ where: { activityId: In(activityIds) }}),
      this.commentRepo
        .createQueryBuilder('c')
        .select('c.activityId', 'activityId')
        .addSelect('COUNT(c.id)', 'count')
        .where('c.activityId IN (:...ids)', { ids: activityIds })
        .groupBy('c.activityId')
        .getRawMany(),
    ]);

    const likersByActivity = new Map<string, Set<string>>();
    for (const like of likes) {
      if (!likersByActivity.has(like.activityId)) likersByActivity.set(like.activityId, new Set());
      likersByActivity.get(like.activityId)!.add(like.userId);
    }
    const commentCountMap = new Map<string, number>(commentCounts.map(c => [c.activityId, parseInt(c.count)]));

    const result = new Map<string, { likesCount: number; commentsCount: number; likedByMe: boolean }>();
    for (const id of activityIds) {
      const likers = likersByActivity.get(id) ?? new Set();
      result.set(id, {
        likesCount: likers.size,
        commentsCount: commentCountMap.get(id) ?? 0,
        likedByMe: userId ? likers.has(userId) : false,
      });
    }
    return result;
  }

  private formatComment(c: ActivityComment) {
    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        avatarUrl: c.user.avatarUrl,
      },
    };
  }
}
