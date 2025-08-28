// Quick script to add a monitor for the real Instagram post
const addMonitor = async () => {
  try {
    console.log('Adding monitor for media ID: 18053482142033648');
    
    // Add a monitor via API
    const response = await fetch('http://localhost:3000/api/comment-monitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postUrl: 'https://www.instagram.com/p/DFICIYYCurs/',
        keyword: 'test',
        autoReplyMessage: 'Hi! You commented "test" on my post. Thanks for engaging with my content!'
      })
    });
    
    const result = await response.json();
    console.log('Monitor creation result:', result);
    
    if (result.success) {
      console.log('✅ Monitor created successfully!');
      console.log('Monitor ID:', result.monitor.id);
      console.log('Post ID:', result.monitor.postId);
      
      // Now link the media ID to this monitor
      const linkResponse = await fetch('http://localhost:3000/api/link-media-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monitorId: result.monitor.id,
          mediaId: '18053482142033648'
        })
      });
      
      const linkResult = await linkResponse.json();
      console.log('Media ID linking result:', linkResult);
      
      if (linkResult.success) {
        console.log('✅ Media ID linked successfully!');
        console.log('Now try commenting "test" on your Instagram post again');
      }
    } else {
      console.error('❌ Failed to create monitor:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the script
addMonitor();