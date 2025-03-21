/**
 * This is a test utility to check if our social media meta tags are working properly
 * 
 * Run with: node server/test-social-meta.js
 */

import fetch from 'node-fetch';

async function testSocialMetaPreview() {
  console.log('Testing social media meta preview functionality...');
  
  // Use a test project slug
  const slug = 'xmentorship';
  
  // First test as a normal user
  console.log('\n1. Testing as a regular browser:');
  const normalResponse = await fetch(`http://localhost:5000/projects/${slug}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  console.log(`Status: ${normalResponse.status}`);
  console.log(`Redirected: ${normalResponse.redirected}`);
  if (normalResponse.redirected) {
    console.log(`Redirect URL: ${normalResponse.url}`);
  }
  
  // Test as Twitter bot
  console.log('\n2. Testing as Twitter bot:');
  const twitterResponse = await fetch(`http://localhost:5000/projects/${slug}`, {
    headers: {
      'User-Agent': 'Twitterbot/1.0'
    },
    redirect: 'manual' // Don't follow redirects automatically
  });
  
  console.log(`Status: ${twitterResponse.status}`);
  console.log(`Redirected: ${twitterResponse.redirected}`);
  if (twitterResponse.redirected) {
    console.log(`Redirect URL: ${twitterResponse.url}`);
  }
  
  // Test direct meta-preview endpoint
  console.log('\n3. Testing direct meta-preview endpoint:');
  const metaResponse = await fetch(`http://localhost:5000/meta-preview/${slug}`);
  
  console.log(`Status: ${metaResponse.status}`);
  
  const text = await metaResponse.text();
  const metaTags = extractMetaTags(text);
  
  console.log('\nMeta Tags from preview endpoint:');
  console.log(JSON.stringify(metaTags, null, 2));
}

// Helper function to extract meta tags from HTML
function extractMetaTags(html) {
  const metaTags = {};
  
  // Match all meta tags
  const ogMatches = html.match(/<meta property="og:([^"]+)" content="([^"]+)"/g) || [];
  const twitterMatches = html.match(/<meta name="twitter:([^"]+)" content="([^"]+)"/g) || [];
  
  // Extract og tags
  ogMatches.forEach(match => {
    const [_, property, content] = match.match(/<meta property="og:([^"]+)" content="([^"]+)"/) || [];
    if (property && content) {
      metaTags[`og:${property}`] = content;
    }
  });
  
  // Extract twitter tags
  twitterMatches.forEach(match => {
    const [_, property, content] = match.match(/<meta name="twitter:([^"]+)" content="([^"]+)"/) || [];
    if (property && content) {
      metaTags[`twitter:${property}`] = content;
    }
  });
  
  return metaTags;
}

// Run the test
testSocialMetaPreview().catch(error => {
  console.error('Error testing social meta preview:', error);
});