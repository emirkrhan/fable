'use client';

import { useParams } from 'next/navigation';
import ReactFlowPlanner from '@/components/ReactFlowPlanner';

export default function BoardPage() {
  const params = useParams();
  const boardId = params.boardId;

  return <ReactFlowPlanner boardId={boardId} />;
}
