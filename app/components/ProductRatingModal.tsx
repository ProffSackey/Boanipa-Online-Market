"use client";

import { useState } from "react";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Product {
  id: string;
  name: string;
  image?: string;
}

interface ProductRatingModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  customerId?: string;
}

export default function ProductRatingModal({
  isOpen,
  product,
  onClose,
  onSubmit,
  customerId,
}: ProductRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setSubmitted(true);
      setTimeout(() => {
        setRating(0);
        setComment("");
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {submitted ? (
          /* Success State */
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600">Your review has been submitted successfully.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate This Product</h2>

            {/* Product Info */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex gap-4">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded bg-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {product.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Rating Question */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                How would you rate this product?
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <StarIcon
                      className={`w-12 h-12 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-orange-400 fill-orange-400"
                          : "text-gray-300 fill-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500">
                Tap the stars to choose
              </p>
            </div>

            {/* Comment Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
                isSubmitting || rating === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
