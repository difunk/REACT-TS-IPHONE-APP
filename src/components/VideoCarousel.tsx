import { useEffect, useRef, useState } from 'react';
import { hightlightsSlides } from '../constants'
import gsap from 'gsap';
import { replayImg, playImg, pauseImg } from '../utils';
import { useGSAP } from '@gsap/react';

const VideoCarousel = () => {
    // Referenz auf Video, Play, Pause, Progression
    const videoRef = useRef<HTMLVideoElement[]>([]); 
    // Referenz auf innere Span-Elemente, welche Progress-Bar zeigen, GSAP kontrolliert breite und Farbe
    const videoSpanRef = useRef<HTMLSpanElement[]>([]);
    // Referenz auf äußere Span-Elemente, Container der Progress-Bar, dynamische Größenanpssung
    const videoDivRef = useRef<HTMLSpanElement[]>([]);

    interface VideoState {
        isEnd: boolean;
        startPlay: boolean;
        videoId: number;
        isLastVideo: boolean;
        isPlaying: boolean;
    }
    
    // Der Video-State steuert, welches Video aktiv ist und ob es läuft
    const [video, setVideo] = useState<VideoState>({
        isEnd: false, // Überprüft ob das aktuelle Video zu Ende ist, um zum nächsten zu wechseln
        startPlay: false, // Triggert den Start eines Videos
        videoId: 0, // Index des aktuellen Videos, um zu wissen welches Video gerade gezeigt und gesteuert wird
        isLastVideo: false, // Überprüft ob das aktuelle Video das letzte in der Liste ist
        isPlaying: false, // Zeigt an ob das aktuelle Video gerade abgespielt wird odere pausiert ist
    })

    // Destrukturierung des Videos, um es ohne Video.isEnd nutzen zu können
    const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;

    useGSAP(() => {
        // Bewegt zur nächsten Slide, sobald sich die VideoId ändert
        gsap.to('#slider', {
            transform: `translateX(${-100 * videoId}%)`,
            duration: 2,
            ease: 'power2.inOut'
        })

        // Sobald das Video-Element durch scrollen sichtbar wird, wird der Video-State verändert
        gsap.to('#video', {
            scrollTrigger: {
                trigger: '#video',
                toggleActions: 'restart none none none'
            },
            onComplete: () => {
                setVideo((prevVideo) => ({
                    ...prevVideo,
                    startPlay: true,
                    isPlaying: true,
                }))
            }
        })
    }, [isEnd, videoId])

    const [loadedData, setLoadedData] = useState<Event[]>([])

    useEffect(() => {
        // Triggert sobald mind. 4 Videos geladen sind
        if(loadedData.length > 3) {
            if(!isPlaying) {
                // Falls isPlaying false ist, wird das aktuelle Video pausiert
                videoRef.current[videoId].pause();
            } else {
                // Falls isPlaying true ist, starte das aktuelle Video nur wenn startPlay true ist
                startPlay && videoRef.current[videoId].play();
            }
        }
    }, [startPlay, videoId, isPlaying, loadedData])


    // Fügt das Event-Objekt, welches die MetaDaten bereits geladen hat, dem loadedData-Array hinzu
    const handleLoadedMetadata = (i, e) => setLoadedData((prevLoadedData => [...prevLoadedData, e])) 

    // Progress Bar Animation
    useEffect(() => {
        let currentProgress = 0;
        let currentProgressionSpan = videoSpanRef.current; // Greift den aktuellen Wert, auf den sich die Referenz bezieht

        if(currentProgressionSpan[videoId]){
            // animate progress of the video
            let animation = gsap.to(currentProgressionSpan[videoId], {
                onUpdate: () => {
                    // Berechnet aktuellen Fortschritt in Prozent
                    const progress = Math.ceil(animation.progress() * 100)

                    // currentProgress wird nur dann aktualisiert, wenn sich der Fortschritt tatsächlich geändert hat
                    if(progress != currentProgress) {
                        currentProgress = progress
                    }

                    // Die Breite des äußeren Containers wird je nach Festergröße angepasst
                    gsap.to(videoDivRef.current[videoId], {
                        width: window.innerWidth < 760
                        ? '10vw'
                        : window.innerHeight < 1200
                        ? '10vw'
                        : '4vw'
                    })

                    // Aktualisierung der Breite und Farbe des aktuellen Progession Spans
                    gsap.to(currentProgressionSpan[videoId], {
                        width: `${currentProgress}%`,
                        backgroundColor: 'white'
                    })
                },
                onComplete: () => {
                    if(isPlaying){
                        // Ruhezustand des äußeren Containers
                        gsap.to(videoDivRef.current[videoId], {
                            width: '12px'
                        })

                        // Setzt die Farbe des Progession-Spans zurück
                        gsap.to(currentProgressionSpan[videoId], {
                            backgroundColor: '#afafaf'
                        })
                    }
                }
            })

            if(videoId === 0 ){
                animation.restart();
            }

            // Sorgt dafür das die Progession der Animation immer exakt dem aktuellen Stand des Videos entspricht
            const animationUpdate = () => {
                animation.progress(
                    videoRef.current[videoId].currentTime /
                    hightlightsSlides[videoId].videoDuration
                )
            }
 
            // Je nach Situation wird animationUpdate ausgeführt
            if(isPlaying){
                gsap.ticker.add(animationUpdate)
            } else {
                gsap.ticker.remove(animationUpdate)
            }
        }
    }, [videoId, startPlay])

    type ProcessType = 'video-end' | 'video-last' | 'video-reset' | 'play' | 'pause';

    const handleProcess = (type: ProcessType, i?: number) => {
        switch (type) {
            case 'video-end':
                setVideo((prevVideo) => ({...prevVideo, isEnd: true, videoId: i !== undefined ? i + 1 : prevVideo.videoId }))
                break;

            case 'video-last':
                setVideo((prevVideo) => ({...prevVideo, isLastVideo: true}))
                break;

            case 'video-reset':
                setVideo((prevVideo) => ({...prevVideo, isLastVideo: false, videoId: 0}))
                break;

            case 'play':
                setVideo((prevVideo) => ({...prevVideo, isPlaying: !prevVideo.isPlaying}))
                break;

            case 'pause':
                setVideo((prevVideo) => ({...prevVideo, isPlaying: !prevVideo.isPlaying}))
                break;

            default:
                return video;
        }
    }

  return (
    <>
        <div className="flex items-center">
            {hightlightsSlides.map((slide, i) => (
                <div key={slide.id} id='slider' className='sm:pr-20 pr-10'>
                    <div className='video-carousel_container'>
                        <div className='w-full h-full flex-center rounded-3xl overflow-hidden bg-black'>
                            <video 
                                id='video' 
                                playsInline={true} 
                                preload='auto' 
                                muted
                                className={`${slide.id === 2 && 'translate-x-44'} pointer-events-none`}
                                 // Speichert das jeweilige Video-Element in videoRef
                                ref={(el) => (videoRef.current[i] = el)}
                                onEnded={() => 
                                    i !== 3 
                                    ? handleProcess('video-end', i)
                                    : handleProcess('video-last')
                                }
                                // Setzt isPlaying des Video-State sicher auf true
                                onPlay={() => {
                                    setVideo((prevVideo) => ({
                                        ...prevVideo, isPlaying: true
                                    }))
                                }}
                                // Triggert die handleLoadedMetadata-Funktion nur dann, wenn Metadaten geladen sind
                                onLoadedMetadata={(e) => handleLoadedMetadata(i, e)}
                                >
                                <source src={slide.video} type='video/mp4'/>
                            </video>
                        </div>
                        <div className='absolute top-12 left-[5%] z-10'>
                            {slide.textLists.map((text) => (
                                <p key={text} className='md:text-2xl text-xl font-medium'>{text}</p>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className='relative flex-center mt-10'>
            <div className='flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full'>
                {videoRef.current.map((_,i) => (
                    <span 
                    key={i} 
                    ref={(el) => {videoDivRef.current[i] = el}} 
                    className='mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer'>
                        <span className='absolute h-full w-full rounded-full'ref={(el) => {
                            videoSpanRef.current[i] = el
                            }}
                        />
                    </span>
                ))}
            </div>
            <button className='control-btn'>
                <img 
                src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg} alt={isLastVideo ? 'replay' : !isPlaying ? 'play' : 'pause' } 
                onClick={isLastVideo 
                    ? () => handleProcess('video-reset')
                    : !isPlaying
                    ? () => handleProcess('play')
                    : () => handleProcess('pause')
                }
                />
            </button>
        </div>
    </>
  )
}

export default VideoCarousel