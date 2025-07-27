const ELEVENLABS_API_KEY = "sk_8119c4b8286ee822721e03c2baac732465ef0965c8cf694b";
const GEMINI_API_KEY = "AIzaSyB9P_JudiqOXDIRUEX03RjhPt0ZH6cDgJA";
const GOOGLE_API_KEY = "AIzaSyA8Cl7q9VLeHClzh2_DZC5-yZf263yzKYA";
const GOOGLE_CX = "cx=d166d00d8aa0f4004";

async function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("response").innerText = "You said: " + transcript;
    handleQuery(transcript);
  };
}

async function handleQuery(userInput) {
  let reply = "Hmm...";

  if (userInput.toLowerCase().includes("wikipedia")) {
    reply = await searchWikipedia(userInput.replace("wikipedia", "").trim());
  } else if (userInput.toLowerCase().includes("search")) {
    reply = await googleSearch(userInput.replace("search", "").trim());
  } else {
    reply = await getGeminiResponse(userInput);
  }

  document.getElementById("response").innerText = reply;
  speakWithElevenLabs(reply);
}

async function getGeminiResponse(input) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}

async function searchWikipedia(query) {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
  if (res.ok) {
    const data = await res.json();
    return data.extract || "Wikipedia par kuch nahi mila.";
  }
  return "Wikipedia se data nahi mila.";
}

async function googleSearch(query) {
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    return `${data.items[0].title}\n${data.items[0].snippet}\n${data.items[0].link}`;
  }
  return "Google par kuch nahi mila.";
}

async function speakWithElevenLabs(text) {
  const voiceId = "k2intd1ORm0YUH8etnXg"; // Female: Rachel
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.7 }
    })
  });

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}
