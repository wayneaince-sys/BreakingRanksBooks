// 30-second video — main app
function VideoApp() {
  return (
    <Stage
      width={1280}
      height={720}
      duration={30}
      background="#0a0604"
      autoplay={false}
      loop={false}
      controls={true}
    >
      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
      <Scene6 />
      <ProgressStrip />
      <Watermark />
      <VoiceoverAudio src="assets/voiceover.mp3" />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<VideoApp />);
