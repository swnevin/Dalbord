
// Add this function to handle preview loading

const handlePreviewClick = async () => {
  setIsLoading(true);
  
  // Show loading state in full screen for better visibility
  document.body.style.overflow = 'hidden';
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'preview-loading';
  loadingDiv.style.position = 'fixed';
  loadingDiv.style.top = '0';
  loadingDiv.style.left = '0';
  loadingDiv.style.width = '100%';
  loadingDiv.style.height = '100%';
  loadingDiv.style.backgroundColor = 'white';
  loadingDiv.style.zIndex = '9999';
  loadingDiv.style.display = 'flex';
  loadingDiv.style.justifyContent = 'center';
  loadingDiv.style.alignItems = 'center';
  loadingDiv.style.flexDirection = 'column';
  
  const loader = document.createElement('div');
  loader.innerHTML = '<div class="preview-loader"></div>';
  
  const text = document.createElement('p');
  text.textContent = 'Laster klient forhåndsvisning...';
  text.style.marginTop = '16px';
  text.style.color = '#666';
  
  loadingDiv.appendChild(loader);
  loadingDiv.appendChild(text);
  document.body.appendChild(loadingDiv);
  
  try {
    const tabNames = memberTabs.map(tab => tab.tab_name);
    enterPreviewMode(memberEmail, organizationId, tabNames);
    
    // Navigate to client dashboard with a slight delay to show loading state
    setTimeout(() => {
      navigate('/dashboard');
      // Remove loading overlay
      const loadingElement = document.getElementById('preview-loading');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
      document.body.style.overflow = 'auto';
      setIsLoading(false);
    }, 1500);
  } catch (error) {
    console.error("Error entering preview mode:", error);
    // Remove loading overlay on error
    const loadingElement = document.getElementById('preview-loading');
    if (loadingElement) {
      document.body.removeChild(loadingElement);
    }
    document.body.style.overflow = 'auto';
    setIsLoading(false);
  }
};

// Make sure we have the needed style for the loader animation
return (
  <>
    <style>
      {`
        .preview-loader {
          width: 80px;
          height: 80px;
          background-image: url('/lovable-uploads/f59d2e9a-80de-456b-bf9a-dd2bd0058c4b.png');
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          animation: loader 3s ease-in-out infinite;
        }
        
        @keyframes loader {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            transform: rotate(0deg) scale(1);
          }
          75% {
            transform: rotate(-90deg) scale(1.1);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
      `}
    </style>
    <Tooltip>
      { /* ... rest of the component ... */ }
    </Tooltip>
  </>
);
