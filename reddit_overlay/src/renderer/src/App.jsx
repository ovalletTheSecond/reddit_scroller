import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

// Ajouter les styles pour l'animation
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}

function App() {
  const [subreddit, setSubreddit] = useState('books')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [rssData, setRssData] = useState('')
  const [posts, setPosts] = useState([])
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [showWebView, setShowWebView] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState('')
  const [autoWebView, setAutoWebView] = useState(false)
  const [fetchedContent, setFetchedContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [fullScreenMode, setFullScreenMode] = useState(false)
  const [showRedditRssReader, setShowRedditRssReader] = useState(true)
  const [showMainContent, setShowMainContent] = useState(true)
  const [showRedditWebview, setShowRedditWebview] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [redditViewFullscreen, setRedditViewFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [mouseTimer, setMouseTimer] = useState(null)

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  // Handle mouse movement for auto-hiding controls
  const handleMouseMove = () => {
    setShowControls(true)
    
    // Clear existing timer
    if (mouseTimer) {
      clearTimeout(mouseTimer)
    }
    
    // Set new timer to hide controls after 3 seconds of inactivity
    const newTimer = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    
    setMouseTimer(newTimer)
  }

  // Clean up timer on component unmount
  const handleMouseLeave = () => {
    if (mouseTimer) {
      clearTimeout(mouseTimer)
    }
    setShowControls(false)
  }

  // Save RSS main content to file
  const saveMainContent = async (content, subreddit) => {
    try {
      if (window.api?.saveDebugFile) {
        const timestamp = new Date().toISOString()
        const fileContent = `=== RSS MAIN CONTENT ===\n` +
                           `Saved at: ${timestamp}\n` +
                           `Subreddit: ${subreddit}\n` +
                           `Posts count: ${posts.length}\n` +
                           `Current post: ${currentPostIndex + 1}\n` +
                           `=== CONTENT ===\n\n` +
                           JSON.stringify(content, null, 2)
        
        const response = await window.api.saveDebugFile('last_main_content.txt', fileContent)
        if (response.success) {
          console.log('📁 Main content saved to last_main_content.txt')
        }
      }
    } catch (error) {
      console.error('Failed to save main content:', error)
    }
  }

  // Save Reddit view content to file
  const saveRedditViewContent = async (content, url, postTitle) => {
    try {
      if (window.api?.saveDebugFile) {
        const timestamp = new Date().toISOString()
        const fileContent = `=== REDDIT VIEW CONTENT ===\n` +
                           `Saved at: ${timestamp}\n` +
                           `Post Title: ${postTitle}\n` +
                           `URL: ${url}\n` +
                           `Content Length: ${content.length} characters\n` +
                           `=== HTML CONTENT ===\n\n` +
                           content
        
        const response = await window.api.saveDebugFile('last_reddit_view.txt', fileContent)
        if (response.success) {
          console.log('📁 Reddit view content saved to last_reddit_view.txt')
        }
      }
    } catch (error) {
      console.error('Failed to save Reddit view content:', error)
    }
  }

  // Load saved content from files
  const loadFromLastSavedPost = async () => {
    try {
      // Load main content
      if (window.api?.loadDebugFile) {
        const mainResponse = await window.api.loadDebugFile('last_main_content.txt')
        if (mainResponse.success && mainResponse.data) {
          const contentMatch = mainResponse.data.match(/=== CONTENT ===\s*\n\n([\s\S]*)/)
          if (contentMatch && contentMatch[1]) {
            try {
              const savedContent = JSON.parse(contentMatch[1])
              setPosts(savedContent.posts || [])
              setCurrentPostIndex(savedContent.currentIndex || 0)
              setSubreddit(savedContent.subreddit || 'books')
              console.log('📂 Loaded main content from last_main_content.txt')
            } catch (parseError) {
              console.error('Error parsing saved main content:', parseError)
            }
          }
        }

        // Load Reddit view content
        const viewResponse = await window.api.loadDebugFile('last_reddit_view.txt')
        if (viewResponse.success && viewResponse.data) {
          const htmlMatch = viewResponse.data.match(/=== HTML CONTENT ===\s*\n\n([\s\S]*)/)
          if (htmlMatch && htmlMatch[1]) {
            setFetchedContent(htmlMatch[1])
            setAutoWebView(true)
            console.log('📂 Loaded Reddit view content from last_reddit_view.txt')
          }
        }

        setResult('✅ Loaded content from last saved post!')
      } else {
        setResult('❌ File APIs not available')
      }
    } catch (error) {
      console.error('Error loading saved content:', error)
      setResult('❌ Error loading saved content: ' + error.message)
    }
  }

  // Vérifier que les APIs sont disponibles
  console.log('APIs available:', {
    electron: !!window.electron,
    api: !!window.api,
    fetchRss: !!window.api?.fetchRss,
    fetchRedditContent: !!window.api?.fetchRedditContent
  })

  // Parse RSS XML to extract posts - similar to your example
  const parseRss = (xmlString) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check if it's an RSS feed (with <item> elements) or Atom feed (with <entry> elements)
      const items = xmlDoc.querySelectorAll('item')
      const entries = xmlDoc.querySelectorAll('entry')
      
      let parsedPosts = []
      
      if (entries.length > 0) {
        // Atom feed format (like Reddit RSS)
        parsedPosts = Array.from(entries).map((entry, index) => {
          const title = entry.querySelector('title')?.textContent || 'No title'
          const link = entry.querySelector('link')?.getAttribute('href') || '#'
          const contentElement = entry.querySelector('content')
          const contentHtml = contentElement?.textContent || contentElement?.innerHTML || 'No content'
          const updated = entry.querySelector('updated')?.textContent || 'No date'
          const author = entry.querySelector('author name')?.textContent || 'Unknown'
          
          return {
            id: index,
            title: title,
            link: link,
            contentHtml: contentHtml,
            pubDate: updated,
            author: author
          }
        })
      } else if (items.length > 0) {
        // RSS feed format
        parsedPosts = Array.from(items).map((item, index) => {
          const title = item.querySelector('title')?.textContent || 'No title'
          const description = item.querySelector('description')?.textContent || 'No description'
          const link = item.querySelector('link')?.textContent || '#'
          const pubDate = item.querySelector('pubDate')?.textContent || 'No date'
          
          return {
            id: index,
            title: title,
            link: link,
            contentHtml: description,
            pubDate: pubDate,
            author: 'Reddit'
          }
        })
      }
      
      console.log(`Parsed ${parsedPosts.length} posts from RSS/Atom feed`)
      if (parsedPosts.length > 0) {
        console.log('First post sample:', {
          title: parsedPosts[0].title,
          link: parsedPosts[0].link,
          contentPreview: parsedPosts[0].contentHtml.slice(0, 100) + '...'
        })
        
        console.log('🚀 CHECKING IF SHOULD FETCH - START')
        // Vérifier si le premier post contient un lien Reddit principal
        const currentPost = parsedPosts[0]
        console.log('🔍 Checking first post link:', currentPost.link)
        console.log('🔍 Is Reddit URL?', isRedditPostUrl(currentPost.link))
        
        if (isRedditPostUrl(currentPost.link)) {
          console.log('✅ CONDITION MET - SHOULD FETCH REDDIT CONTENT')
          console.log('🔗 Reddit post detected:', currentPost.link)
          fetchRedditContent(currentPost.link)
        } else {
          console.log('❌ CONDITION NOT MET - NO REDDIT FETCH')
          console.log('📄 Not a Reddit post, skipping auto-fetch')
        }
        console.log('🚀 CHECKING IF SHOULD FETCH - END')
      } else {
        console.log('⚠️ NO POSTS PARSED - NO FETCH CHECK')
      }
      
      return parsedPosts
    } catch (error) {
      console.error('Error parsing RSS/Atom feed:', error)
      return []
    }
  }

  const handleFetchRss = async () => {
    if (!subreddit.trim()) {
      alert('Veuillez entrer un nom de subreddit')
      return
    }

    setLoading(true)
    setResult('')
    setRssData('')
    setPosts([])
    setCurrentPostIndex(0)

    try {
      const response = await window.api.fetchRss(subreddit.trim())
      
      if (response.success) {
        setResult(`RSS récupéré avec succès pour r/${subreddit}! ${response.data.length} caractères reçus.`)
        setRssData(response.data)
        
        // Parse RSS and extract posts
        const parsedPosts = parseRss(response.data)
        setPosts(parsedPosts)
        setCurrentPostIndex(0)
        
        // Save main content
        const contentToSave = {
          posts: parsedPosts,
          currentIndex: 0,
          subreddit: subreddit,
          rssData: response.data
        }
        await saveMainContent(contentToSave, subreddit)
        
        // If first post is a Reddit post, fetch its content and comments
        if (parsedPosts.length > 0 && isRedditPostUrl(parsedPosts[0].link)) {
          fetchRedditContent(parsedPosts[0].link)
          fetchComments(parsedPosts[0].link)
        }
        
        console.log('RSS Data:', response.data.slice(0, 1000))
        console.log('Parsed posts:', parsedPosts.length)
      } else {
        setResult(`Erreur: ${response.error}`)
      }
    } catch (error) {
      setResult(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const nextPost = () => {
    if (currentPostIndex < posts.length - 1) {
      const newIndex = currentPostIndex + 1
      setCurrentPostIndex(newIndex)
      
      // Reset comments when changing posts
      setComments([])
      
      // Vérifier si le nouveau post a un lien Reddit principal
      if (posts[newIndex] && isRedditPostUrl(posts[newIndex].link)) {
        console.log('url main found - url fetched - response : fetching...', posts[newIndex].link)
        fetchRedditContent(posts[newIndex].link)
        fetchComments(posts[newIndex].link)
      } else {
        setAutoWebView(false)
        setFetchedContent('')
      }
    }
  }

  const previousPost = () => {
    if (currentPostIndex > 0) {
      const newIndex = currentPostIndex - 1
      setCurrentPostIndex(newIndex)
      
      // Reset comments when changing posts
      setComments([])
      
      // Vérifier si le nouveau post a un lien Reddit principal
      if (posts[newIndex] && isRedditPostUrl(posts[newIndex].link)) {
        console.log('url main found - url fetched - response : fetching...', posts[newIndex].link)
        fetchRedditContent(posts[newIndex].link)
        fetchComments(posts[newIndex].link)
      } else {
        setAutoWebView(false)
        setFetchedContent('')
      }
    }
  }

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5))
  }

  // Fetch comments from Reddit API
  const fetchComments = async (postUrl) => {
    try {
      setCommentsLoading(true)
      console.log('🔍 Fetching comments for:', postUrl)
      
      // Extract subreddit and post ID from URL
      const urlMatch = postUrl.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/)
      if (!urlMatch) {
        console.log('❌ Could not parse Reddit URL')
        setCommentsLoading(false)
        return
      }
      
      const [, subreddit, postId] = urlMatch
      
      // Use Reddit's internal shreddit API for comments
      const commentsApiUrl = `https://www.reddit.com/svc/shreddit/comments/r/${subreddit}/t3_${postId}?render-mode=partial&force_seo=1&seeker-session=true&referer=https%3A%2F%2Fwww.google.com%2F`
      
      console.log('📡 Fetching from API:', commentsApiUrl)
      
      const response = await window.api.fetchRedditContent(commentsApiUrl)
      
      if (response.success) {
        console.log('✅ Comments API response received:', response.data.length, 'characters')
        
        // Parse the HTML response to extract comments
        const parser = new DOMParser()
        const doc = parser.parseFromString(response.data, 'text/html')
        
        // Look for Reddit's new comment elements (shreddit components)
        const commentElements = doc.querySelectorAll('shreddit-comment, [data-testid="comment"], .Comment, [class*="comment"]')
        
        console.log(`📝 Found ${commentElements.length} comment elements in HTML`)
        
        const parsedComments = []
        
        commentElements.forEach((commentEl, index) => {
          try {
            // Extract author from shreddit-comment attribute (most reliable)
            const authorAttr = commentEl.getAttribute('author') || commentEl.getAttribute('data-author')
            
            // Fallback to DOM elements
            const authorEl = commentEl.querySelector('[slot="authorName"], [data-testid="comment_author_link"], [data-click-id="user"], .author, a[href*="/user/"]')
            const fallbackAuthor = authorEl?.textContent?.trim() || authorEl?.getAttribute('href')?.replace('/user/', '') || 'Unknown'
            
            const finalAuthor = authorAttr || fallbackAuthor
            
            // Extract comment content using a more maintainable approach
            let contentEl = commentEl.querySelector('[slot="comment"]')
            
            // Method 2: Look for content by ID pattern
            if (!contentEl) {
              const thingId = commentEl.getAttribute('thingId')
              if (thingId) {
                contentEl = commentEl.querySelector(`[id*="${thingId}"]`) || 
                           commentEl.querySelector(`#${thingId}-comment-rtjson-content`) ||
                           commentEl.querySelector(`#${thingId}-post-rtjson-content`)
              }
            }
            
            // Method 3: Look for structural patterns
            if (!contentEl) {
              contentEl = commentEl.querySelector('div[dir="auto"]') ||
                         commentEl.querySelector('.md') ||
                         commentEl.querySelector('div:has(p)') ||
                         commentEl.querySelector('p')
            }
            
            // Extract the actual text content with improved error handling
            let content = 'No content'
            if (contentEl) {
              let textContent = contentEl.textContent?.trim()
              
              if (textContent && textContent.length > 0) {
                content = textContent
              } else {
                const innerHTML = contentEl.innerHTML || ''
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = innerHTML
                const scripts = tempDiv.querySelectorAll('script, style')
                scripts.forEach(el => el.remove())
                content = tempDiv.textContent?.trim() || 'No content'
              }
              
              content = content
                .replace(/\s+/g, ' ')
                .replace(/^(Reply|Share|Save|Report)\s*/, '')
                .trim()
            }
            
            if (content === 'No content' || content.length < 3 || 
                content.includes('class=') || content.includes('data-') ||
                content.match(/^[0-9\s\-•·]+$/)) {
              content = 'No content'
            }
            
            // Extract time information using semantic selectors
            let timeText = 'Unknown time'
            const timeEl = commentEl.querySelector('time')
            if (timeEl) {
              timeText = timeEl.getAttribute('title') || 
                        timeEl.textContent?.trim() || 
                        timeEl.getAttribute('datetime') || 
                        'Unknown time'
            } else {
              const timeElement = commentEl.querySelector('[datetime], [title*="ago"], [aria-label*="ago"]')
              if (timeElement) {
                timeText = timeElement.getAttribute('title') || 
                          timeElement.textContent?.trim() || 
                          timeElement.getAttribute('datetime') ||
                          'Unknown time'
              }
            }
            
            // Validate that we have meaningful content
            const hasValidAuthor = finalAuthor && finalAuthor !== 'Unknown' && finalAuthor.length > 1
            const hasValidContent = content && content !== 'No content' && content.length > 3 && 
                                  !content.includes('class=') && !content.includes('data-')
            
            if (hasValidAuthor || hasValidContent) {
              parsedComments.push({
                id: index,
                author: finalAuthor.replace(/^u\//, ''),
                contentHtml: content,
                pubDate: timeText,
                link: postUrl,
                type: 'comment',
                isComment: true,
                title: `Comment by ${finalAuthor}`,
                redditId: commentEl.getAttribute('thingId') || `t1_comment_${index}`
              })
              
              console.log(`✅ Parsed comment ${index}: ${finalAuthor} - "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}")`)
            } else {
              console.log(`⚠️ Skipped comment ${index}: insufficient data (author: "${finalAuthor}", content: "${content.slice(0, 30)}...")`) 
            }
          } catch (parseError) {
            console.log('Error parsing comment element:', parseError)
          }
        })
        
        console.log(`📝 Parsed ${parsedComments.length} comments`)
        setComments(parsedComments)
        
      } else {
        console.error('❌ Failed to fetch comments from API:', response.error)
      }
      
    } catch (error) {
      console.error('❌ Error fetching comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  // Fonction pour détecter les liens Reddit
  const isRedditPostUrl = (url) => {
    const isReddit = url && url.includes('reddit.com/r/') && url.includes('/comments/')
    console.log('🔍 URL check:', { url, isReddit })
    return isReddit
  }

  // Fonction pour ouvrir le webview avec un lien Reddit
  const openRedditPost = (url) => {
    setWebViewUrl(url)
    setShowWebView(true)
  }

  // Fonction pour fermer le webview
  const closeWebView = () => {
    setShowWebView(false)
    setWebViewUrl('')
    setAutoWebView(false)
    setFetchedContent('')
  }

  // Fonctions pour le mode plein écran
  const enterFullScreenMode = () => {
    setFullScreenMode(true)
  }

  const exitFullScreenMode = () => {
    setFullScreenMode(false)
  }

  // Intercepter les clics sur les liens
  const handleLinkClick = (event) => {
    const target = event.target
    if (target.tagName === 'A') {
      const href = target.getAttribute('href')
      if (href && isRedditPostUrl(href)) {
        event.preventDefault()
        openRedditPost(href)
      }
    }
  }

  // Fonction pour fetch le contenu HTML d'une page Reddit
  const fetchRedditContent = async (url) => {
    console.log('🔗 Starting Reddit content fetch for:', url)
    setContentLoading(true)
    setAutoWebView(true)
    
    try {
      console.log('🔄 Calling main process to fetch Reddit content...')
      const response = await window.api.fetchRedditContent(url)
      console.log('📦 Response received from main process:', { success: response.success })
      
      if (response.success) {
        console.log('✅ Reddit content fetched successfully, length:', response.data.length)
        setFetchedContent(response.data)
        
        // Save the Reddit view content
        const postTitle = posts[currentPostIndex]?.title || 'Unknown Post'
        await saveRedditViewContent(response.data, url, postTitle)
      } else {
        console.error('❌ Error fetching Reddit content:', response.error)
        setFetchedContent('<div style="padding: 20px; text-align: center; color: #c62828;">Erreur lors du chargement du contenu Reddit: ' + response.error + '</div>')
      }
      
      setContentLoading(false)
    } catch (error) {
      console.error('❌ Exception while fetching Reddit content:', error)
      setFetchedContent('<div style="padding: 20px; text-align: center; color: #c62828;">Erreur lors du chargement du contenu Reddit: ' + error.message + '</div>')
      setContentLoading(false)
    }
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        boxSizing: 'border-box',
        fontSize: `${zoomLevel}rem`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {fullScreenMode ? (
        // Mode plein écran
        <>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Webview 80% de la hauteur */}
          {showRedditWebview && (
          <div style={{
            flex: '0.8',
            border: 'none',
            backgroundColor: '#fff',
            overflow: 'hidden',
            minHeight: '0'
          }}>
            {contentLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '18px',
                color: '#666',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px' }}>🔄 Loading Reddit content...</div>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #007ACC',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={fetchedContent}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Reddit Post Content"
              />
            )}
          </div>
          )}
          
          {/* Contrôles de navigation 20% de la hauteur */}
          <div style={{
            flex: '0.2',
            backgroundColor: '#f8f9fa',
            borderTop: '2px solid #007ACC',
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '100px'
          }}>
            {/* Section gauche - Navigation des posts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={previousPost}
                disabled={currentPostIndex === 0}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ← Previous
              </button>
              
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#007ACC',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {currentPostIndex + 1} / {posts.length}
              </div>
              
              <button 
                onClick={nextPost}
                disabled={currentPostIndex === posts.length - 1}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentPostIndex === posts.length - 1 ? '#ccc' : '#28a745',
                  color: 'white',
                  cursor: currentPostIndex === posts.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Next →
              </button>
            </div>
            
            {/* Section centre - Titre du post actuel */}
            <div style={{
              flex: '1',
              margin: '0 20px',
              textAlign: 'center'
            }}>
              {posts.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 5px 0',
                    fontSize: '16px',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {posts[currentPostIndex]?.title || 'No title'}
                  </h3>
                  <div style={{
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    r/{subreddit} • {posts[currentPostIndex]?.author || 'Unknown'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Section droite - Contrôles subreddit et mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  placeholder="Subreddit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '120px',
                    fontSize: '14px'
                  }}
                />
                <button 
                  onClick={handleFetchRss} 
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#007ACC',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontSize: '14px'
                  }}
                >
                  {loading ? '...' : 'Load'}
                </button>
                <button 
                  onClick={loadFromLastSavedPost} 
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  title="Load content from last saved post"
                >
                  📂 Browse from last saved post
                </button>
              </div>
              
              <button 
                onClick={exitFullScreenMode}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '2px solid #dc3545',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
        </div>
        
        {/* Contrôles de visibilité - coin inférieur gauche en fullscreen */}
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          zIndex: 10000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}>
          <button
            onClick={() => setShowRedditWebview(!showRedditWebview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666'
            }}
            title={showRedditWebview ? 'Hide Reddit Webview' : 'Show Reddit Webview'}
          >
            <span style={{ fontSize: '14px' }}>{showRedditWebview ? '👁️' : '👁️‍🗨️'}</span>
            Reddit View
          </button>
          
          <button
            onClick={() => setFullScreenMode(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              borderRadius: '4px'
            }}
            title="Exit Fullscreen"
          >
            <span style={{ fontSize: '14px' }}>✕</span>
            Exit
          </button>
        </div>
        </>
      ) : (
        // Mode normal
        <div style={{ display: 'flex', height: '100%', padding: '10px', gap: '10px' }}>
          {/* Control Panel */}
          {showRedditRssReader && (
            <div style={{
              flexShrink: 0,
              width: '300px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#fff',
            height: 'fit-content'
          }}>
            <h1 style={{
              margin: '0 0 15px 0',
              color: '#007ACC',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Reddit RSS Reader
            </h1>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                color: '#333',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Subreddit:
              </label>
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                placeholder="e.g., javascript"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #007ACC',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleFetchRss}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: loading ? '#ccc' : '#007ACC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Chargement...' : 'Récupérer RSS'}
              </button>
              <button
                onClick={loadFromLastSavedPost}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}
                title="Load content from last saved post"
              >
                📂 Browse from last saved post
              </button>
            </div>
            
            {/* Navigation Buttons */}
            {posts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={previousPost}
                  disabled={currentPostIndex === 0}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745', 
                    color: 'black',
                    cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous Post
                </button>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {currentPostIndex + 1} / {posts.length}
                </span>
                <button 
                  onClick={nextPost}
                  disabled={currentPostIndex === posts.length - 1}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    backgroundColor: currentPostIndex === posts.length - 1 ? '#ccc' : '#28a745', 
                    color: 'black',
                    cursor: currentPostIndex === posts.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next Post →
                </button>
                {autoWebView && (
                  <button
                    onClick={() => setFullScreenMode(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007ACC',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '5px'
                    }}
                  >
                    🔍 Fullscreen
                  </button>
                )}
                <button
                  onClick={() => setAutoWebView(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '5px'
                  }}
                >
                  📄 Vanilla RSS
                </button>
                
                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                  <button
                    onClick={zoomOut}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            
            {result && (
              <div style={{ 
                marginTop: '10px', 
                padding: '8px', 
                backgroundColor: result.includes('Erreur') ? '#ffebee' : '#e8f5e8',
                borderRadius: '4px',
                color: result.includes('Erreur') ? '#c62828' : '#2e7d32',
                fontSize: '14px'
              }}>
                {result}
              </div>
            )}
          </div>
          )}

          {/* Content Display Area */}
          {showMainContent && (
          <div style={{ 
            flex: autoWebView && showRedditWebview ? '0.6' : '1', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: '#fff',
            overflow: 'auto',
            minHeight: '0',
            marginBottom: autoWebView && showRedditWebview ? '10px' : '0'
          }}>
            {posts.length > 0 ? (
              <div>
                {/* Enhanced Header with Gradient */}
                <div style={{
                  background: 'linear-gradient(135deg, #007ACC 0%, #0056b3 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(0, 122, 204, 0.2)'
                }}>
                  <h2 style={{ 
                    marginTop: '0', 
                    marginBottom: '10px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text'
                  }}>
                    {posts[currentPostIndex].title}
                  </h2>
                  <div style={{ 
                    fontSize: '13px', 
                    opacity: 0.9,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px',
                    alignItems: 'center'
                  }}>
                    <div><strong>Author:</strong> {posts[currentPostIndex].author}</div>
                    <div><strong>Published:</strong> {posts[currentPostIndex].pubDate}</div>
                    {isRedditPostUrl(posts[currentPostIndex].link) && (
                      <button
                        onClick={() => fetchComments(posts[currentPostIndex].link)}
                        disabled={commentsLoading}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: commentsLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Fetch Reddit Comments"
                      >
                        {commentsLoading ? (
                          <>
                            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                            Loading...
                          </>
                        ) : (
                          <>
                            💬 Fetch Comments
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <a 
                      href={posts[currentPostIndex].link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        textDecoration: 'none',
                        fontSize: '12px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {posts[currentPostIndex].link}
                    </a>
                  </div>
                </div>
                <div 
                  style={{ 
                    lineHeight: '1.6',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    color: '#333',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text'
                  }}
                  onClick={handleLinkClick}
                  dangerouslySetInnerHTML={{ 
                    __html: posts[currentPostIndex].contentHtml
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&amp;/g, '&')
                  }}
                />
                
                {/* Comments Section */}
                {(comments.length > 0 || commentsLoading) && (
                  <div style={{
                    marginTop: '30px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{
                        color: '#007ACC',
                        margin: '0',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        💬 Comments {comments.length > 0 ? `(${comments.length})` : ''}
                      </h3>
                      {commentsLoading && (
                        <span style={{
                          color: '#666',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                          Loading comments...
                        </span>
                      )}
                    </div>
                    {comments.map((comment, index) => (
                      <div key={comment.id || index} style={{
                        backgroundColor: 'white',
                        border: '1px solid #e3e6ea',
                        borderRadius: '10px',
                        padding: '15px',
                        marginBottom: '12px',
                        borderLeft: '4px solid #007ACC',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s ease',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '10px',
                          fontSize: '14px'
                        }}>
                          <div style={{
                            backgroundColor: '#007ACC',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginRight: '10px'
                          }}>
                            u/{comment.author}
                          </div>
                          <span style={{ 
                            color: '#666', 
                            fontSize: '12px',
                            backgroundColor: '#f1f3f4',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {comment.pubDate}
                          </span>
                        </div>
                        <div style={{
                          color: '#333',
                          lineHeight: '1.5',
                          fontSize: '14px',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                          paddingLeft: '5px'
                        }}>
                          {comment.contentHtml}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : rssData ? (
              <div>
                <h3>Raw RSS Data:</h3>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  color: '#333',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                  msUserSelect: 'text'
                }}>
                  {rssData}
                </pre>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666',
                fontSize: '16px'
              }}>
                Enter a subreddit name and click "Récupérer RSS" to load content
              </div>
            )}
            </div>
          )}
          
          {/* Auto WebView en bas pour les posts Reddit */}
          {autoWebView && showRedditWebview && (
            <div style={{
              flex: '0.4',
              border: '1px solid #007ACC',
              borderRadius: '8px',
              backgroundColor: '#fff',
              overflow: 'hidden',
              minHeight: '200px'
            }}>
              {/* Pas de header - contenu direct */}
              
              {/* Contenu du webview */}
              <div style={{
                height: '100%',
                overflow: 'auto',
                position: 'relative'
              }}>
                {contentLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    fontSize: '16px',
                    color: '#666'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '10px' }}>🔄 Loading Reddit content...</div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007ACC',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                      }}></div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setRedditViewFullscreen(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    title="Click to view fullscreen"
                  >
                    <iframe
                      srcDoc={fetchedContent}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'none'
                      }}
                      title="Reddit Post Content"
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      pointerEvents: 'none'
                    }}>
                      🔍 Click to expand
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Contrôles de visibilité - coin inférieur gauche */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: showControls ? 'auto' : 'none'
      }}>
        <button
          onClick={() => setShowRedditRssReader(!showRedditRssReader)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666'
          }}
          title={showRedditRssReader ? 'Hide Reddit RSS Reader' : 'Show Reddit RSS Reader'}
        >
          <span style={{ fontSize: '14px' }}>{showRedditRssReader ? '👁️' : '👁️‍🗨️'}</span>
          RSS Reader
        </button>
        
        <button
          onClick={() => setShowMainContent(!showMainContent)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666'
          }}
          title={showMainContent ? 'Hide Main Content' : 'Show Main Content'}
        >
          <span style={{ fontSize: '14px' }}>{showMainContent ? '👁️' : '👁️‍🗨️'}</span>
          Main Content
        </button>
        
        <button
          onClick={() => setShowRedditWebview(!showRedditWebview)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666'
          }}
          title={showRedditWebview ? 'Hide Reddit Webview' : 'Show Reddit Webview'}
        >
          <span style={{ fontSize: '14px' }}>{showRedditWebview ? '👁️' : '👁️‍🗨️'}</span>
          Reddit View
        </button>
      </div>
      
      {/* Navigation controls - coin supérieur droit */}
      {posts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}>
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}>
          <button
            onClick={previousPost}
            disabled={currentPostIndex === 0}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745',
              color: 'white',
              cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
            title="Previous Post"
          >
            ←
          </button>
          
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#007ACC',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '40px',
            textAlign: 'center'
          }}>
            {currentPostIndex + 1}/{posts.length}
          </span>
          
          <button
            onClick={nextPost}
            disabled={currentPostIndex === posts.length - 1}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: currentPostIndex === posts.length - 1 ? '#ccc' : '#28a745',
              color: 'white',
              cursor: currentPostIndex === posts.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
            title="Next Post"
          >
            →
          </button>
          
          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '8px', padding: '2px', backgroundColor: 'rgba(108, 117, 125, 0.1)', borderRadius: '4px' }}>
            <button
              onClick={zoomOut}
              style={{
                padding: '4px 6px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Zoom Out"
            >
              −
            </button>
            <span style={{
              fontSize: '10px',
              color: '#666',
              minWidth: '30px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={zoomIn}
              style={{
                padding: '4px 6px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>
      )}
      
      {/* Fullscreen Reddit View Overlay */}
      {redditViewFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Top controls bar */}
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 10000,
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 12px',
            borderRadius: '20px',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showControls ? 'auto' : 'none'
          }}>
            <button
              onClick={() => setRedditViewFullscreen(false)}
              style={{
                padding: '6px 10px',
                borderRadius: '15px',
                border: 'none',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Close fullscreen"
            >
              ✕ Close
            </button>
          </div>
          
          {/* Fullscreen iframe */}
          <iframe
            srcDoc={fetchedContent}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Reddit Post Content - Fullscreen"
          />
        </div>
      )}
    </div>
  )
}

export default App
