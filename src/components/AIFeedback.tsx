import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface AIFeedbackProps {
  feature: string;
  query: string;
  response: string;
  token: string;
}

export default function AIFeedback({ feature, query, response, token }: AIFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = async (rating: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feature,
          query,
          response,
          rating,
          comment: comment || undefined
        })
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Thank you for your feedback! AI is learning.');
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      toast.error('Could not submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
        <ThumbsUp className="h-3 w-3" />
        <span>Feedback received - AI training in progress</span>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Was this helpful for your decision?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback(1)}
            disabled={loading}
            className="p-2 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-all"
            title="Helpful"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (showComment) {
                handleFeedback(-1);
              } else {
                setShowComment(true);
              }
            }}
            disabled={loading}
            className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-all"
            title="Not Helpful"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowComment(!showComment)}
            className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all"
            title="Add Comment"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showComment && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us how to improve... (optional)"
            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-indigo-500/20"
            rows={2}
          />
          {!submitted && (
            <div className="flex justify-end">
              <button
                onClick={() => handleFeedback(-1)}
                disabled={loading}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
