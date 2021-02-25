import React, { useState } from "react";

export default function DarkModeButtonComponent() {
  const [darkModeOn, setDarkModeOn] = useState(false);
  
  function onDarkModeButtonClick() {
    
    setDarkModeOn(prevState => {
      document.body.style.backgroundColor = !prevState ? '#252525' : 'white';
      return !prevState
    });
    
  }

  return (
    <div style={{float: 'right'}}>
      <button style={{color: '#505050'}} onClick={onDarkModeButtonClick}>{darkModeOn ? 'Light' : 'Dark'} Mode</button>
    </div>

  )
}