/**
 * Static CCTV Monitoring Module configuration settings.
 * All settings are stored locally for instant GitHub Pages compatibility.
 */
const CONFIG = {
  // Replace these with your actual Firebase project settings
  FIREBASE: {
    apiKey: "AIzaSyFakeApiKeyForStaticDeployOnly",
    authDomain: "astha-society.firebaseapp.com",
    projectId: "astha-society",
    storageBucket: "astha-society.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
  },
  
  // High fidelity default streams for quick preview
  DEFAULT_STREAMS: [
    {
      id: "cam-01",
      name: "Front Gate Intake 01",
      location: "Tower 1 Perimeter Fence",
      url: "https://test-streams.mux.dev/x36xhg/playlist.m3u8",
      type: "HLS",
      status: "Online",
      allowedRoles: ["Admin", "Committee Member", "Security Guard"]
    },
    {
      id: "cam-02",
      name: "Underground Lobby 02",
      location: "Parking Basements Lobby Lift",
      url: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
      type: "HLS",
      status: "Online",
      allowedRoles: ["Admin", "Committee Member", "Security Guard", "Resident"]
    },
    {
      id: "cam-03",
      name: "Tower B Main Reception",
      location: "Tower B Ground Lounge Lobby",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      type: "HLS",
      status: "Online",
      allowedRoles: ["Admin", "Committee Member", "Security Guard"]
    },
    {
      id: "cam-04",
      name: "Kids Lawn Complex",
      location: "North Garden Play Arena",
      url: "https://stream.example.com/camera1/index.m3u8",
      type: "HLS",
      status: "Offline",
      allowedRoles: ["Admin", "Committee Member", "Security Guard", "Resident"]
    }
  ]
};
export default CONFIG;
