import { NextRequest, NextResponse } from 'next/server';
import { parseInstagramPostId, validateInstagramPost } from '@/lib/comment-monitor-storage';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { postUrl } = await request.json();
    
    if (!postUrl) {
      return NextResponse.json(
        { error: 'Post URL is required' },
        { status: 400 }
      );
    }

    logger.info('Testing Instagram post validation', 'TEST_API', { postUrl });

    // Step 1: Parse the URL
    const urlValidation = parseInstagramPostId(postUrl.trim());
    
    if (!urlValidation.isValid) {
      return NextResponse.json({
        success: false,
        step: 'URL_PARSING',
        error: urlValidation.error,
        postUrl: postUrl.trim()
      });
    }

    const postId = urlValidation.postId!;
    logger.info('URL parsing successful', 'TEST_API', { postId });

    // Step 2: Validate the post
    const postValidation = await validateInstagramPost(postId);
    
    return NextResponse.json({
      success: postValidation.isValid,
      step: postValidation.isValid ? 'VALIDATION_SUCCESS' : 'VALIDATION_FAILED',
      postUrl: postUrl.trim(),
      postId,
      error: postValidation.error,
      message: postValidation.isValid 
        ? 'Instagram post validation completed successfully' 
        : 'Instagram post validation failed'
    });

  } catch (error) {
    logger.error('Test API error', 'TEST_API', {}, error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        success: false,
        step: 'API_ERROR',
        error: 'Internal server error during validation test' 
      },
      { status: 500 }
    );
  }
}