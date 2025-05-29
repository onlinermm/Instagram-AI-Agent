import { SchemaType } from "@google/generative-ai";
import mongoose, { Document, Schema, Model } from 'mongoose';


export interface InstagramCommentSchema {
    description: string;
    type: SchemaType;
    items: {
        type: SchemaType;
        properties: {
            comment: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            viralRate: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            commentTokenCount: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
        };
        required: string[];
    };
}

export const getInstagramCommentSchema = (): InstagramCommentSchema => {
    return {
        description: `Lists comments that are engaging and have the potential to attract more likes and go viral.`,
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                comment: {
                    type: SchemaType.STRING,
                    description: "A comment between 150 and 250 characters.",
                    nullable: false,
                },
                viralRate: {
                    type: SchemaType.NUMBER,
                    description: "The viral rate, measured on a scale of 0 to 100.",
                    nullable: false,
                },
                commentTokenCount: {
                    type: SchemaType.NUMBER,
                    description: "The total number of tokens in the comment.",
                    nullable: false,
                },
            },
            required: [
                "comment",
                "viralRate",
                "commentTokenCount"
            ],
        },
    };
};

export interface RealEstateRelevanceSchema {
    description: string;
    type: SchemaType;
    items: {
        type: SchemaType;
        properties: {
            isRelevant: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            relevanceScore: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            detectedKeywords: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            category: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
            reason: {
                type: SchemaType;
                description: string;
                nullable: boolean;
            };
        };
        required: string[];
    };
}

export const getRealEstateRelevanceSchema = (): RealEstateRelevanceSchema => {
    return {
        description: `Analyzes Instagram post content to determine if it's relevant to real estate business and worth engaging with.`,
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                isRelevant: {
                    type: SchemaType.BOOLEAN,
                    description: "Whether the post is relevant to real estate business (true/false).",
                    nullable: false,
                },
                relevanceScore: {
                    type: SchemaType.NUMBER,
                    description: "Relevance score from 0 to 100, where 100 is highly relevant to real estate.",
                    nullable: false,
                },
                detectedKeywords: {
                    type: SchemaType.STRING,
                    description: "Comma-separated list of real estate keywords found in the content.",
                    nullable: true,
                },
                category: {
                    type: SchemaType.STRING,
                    description: "Real estate category: 'residential', 'commercial', 'investment', 'rental', 'construction', 'renovation', 'market_analysis', 'other' or 'not_relevant'.",
                    nullable: false,
                },
                reason: {
                    type: SchemaType.STRING,
                    description: "Brief explanation of why the content is or isn't relevant to real estate.",
                    nullable: false,
                },
            },
            required: [
                "isRelevant",
                "relevanceScore", 
                "category",
                "reason"
            ],
        },
    };
};



// Define the interface for the Tweet document
interface ITweet extends Document {
  tweetContent: string;
  imageUrl: string;
  timeTweeted: Date;
}

// Define the schema for the Tweet document
const tweetSchema: Schema<ITweet> = new Schema({
  tweetContent: { type: String, required: true },
  imageUrl: { type: String, required: true },
  timeTweeted: { type: Date, default: Date.now },
});

// Create the model for the Tweet document
const Tweet: Model<ITweet> = mongoose.model<ITweet>('Tweet', tweetSchema);

export default Tweet;