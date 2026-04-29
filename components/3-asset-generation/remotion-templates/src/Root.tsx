import "./index.css";
import { Composition } from "remotion";
// @ts-ignore - JSX files
import { PlayerIntroShort } from "./compositions/PlayerIntroShort";
// @ts-ignore - JSX files
import { PlayerIntroFull } from "./compositions/PlayerIntroFull";
// @ts-ignore - JSX files
import { TeamBanner } from "./compositions/TeamBanner";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PlayerIntroShort"
        component={PlayerIntroShort}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          player: {
            name: "Player Name",
            firstName: "Player",
            lastName: "Name",
            number: "0",
            position: "Position",
            photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect fill='%23333' width='1080' height='1920'/%3E%3C/svg%3E",
            focalPoint: { x: 0.5, y: 0.5 },
            stats: {}
          },
          team: {
            name: "Team Name",
            sport: "Sport",
            logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2300D4FF'/%3E%3C/svg%3E"
          },
          brand: {
            colors: {
              primary: "#00D4FF",
              accent: "#FF006E",
              secondary: "#64748B",
              background: "#0F172A"
            },
            fonts: {
              display: "Inter, sans-serif",
              body: "Inter, sans-serif"
            }
          },
          flags: {
            useAiMotion: false
          }
        }}
      />
      <Composition
        id="PlayerIntroFull"
        component={PlayerIntroFull}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          player: {
            name: "Player Name",
            firstName: "Player",
            lastName: "Name",
            number: "0",
            position: "Position",
            photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23333' width='1920' height='1080'/%3E%3C/svg%3E",
            focalPoint: { x: 0.5, y: 0.5 },
            stats: {}
          },
          team: {
            name: "Team Name",
            sport: "Sport",
            logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2300D4FF'/%3E%3C/svg%3E"
          },
          brand: {
            colors: {
              primary: "#00D4FF",
              accent: "#FF006E",
              secondary: "#64748B",
              background: "#0F172A"
            },
            fonts: {
              display: "Inter, sans-serif",
              body: "Inter, sans-serif"
            }
          },
          flags: {
            useAiMotion: false
          }
        }}
      />
      <Composition
        id="TeamBanner"
        component={TeamBanner}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          player: {
            name: "Player Name",
            firstName: "Player",
            lastName: "Name",
            number: "0",
            position: "Position",
            photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23333' width='1920' height='1080'/%3E%3C/svg%3E",
            focalPoint: { x: 0.5, y: 0.5 },
            stats: {}
          },
          team: {
            name: "Team Name",
            sport: "Sport",
            logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2300D4FF'/%3E%3C/svg%3E"
          },
          brand: {
            colors: {
              primary: "#00D4FF",
              accent: "#FF006E",
              secondary: "#64748B",
              background: "#0F172A"
            },
            fonts: {
              display: "Inter, sans-serif",
              body: "Inter, sans-serif"
            }
          },
          flags: {
            useAiMotion: false
          }
        }}
      />
    </>
  );
};
