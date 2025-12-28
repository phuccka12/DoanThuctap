import React from 'react';
import AIWriting from './pages/AiWriting'; // Nhớ đường dẫn cho đúng
import AISpeaking from './pages/AISpeaking'; // Nhớ đường dẫn cho đúng
import AIConversation from './pages/AIConversation';
function App() {
  return (
    <div className="App">
       <AIWriting />
       <AISpeaking />
       <AIConversation />
    </div>
  );
}

export default App;