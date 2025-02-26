import React, { useMemo, useEffect, useState } from 'react';
import View360, { EquirectProjection, ControlBar } from "@egjs/react-view360";
import "@egjs/react-view360/css/view360.min.css";
import { getImage } from '../../api/imageApi';
import confetti from "canvas-confetti";
import useCustomMove from '../../hooks/useCustomMove';
import WriteModal from '../common/WriteModal';
import { createBase64DataToBlob } from "../../util/imageUtil";

const ResultComponent = ({ ino }) => {
    const { refresh } = useCustomMove();
    const [projection, setProjection] = useState(null);

    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const openWriteModal = () => setIsWriteModalOpen(true);
    const closeWriteModal = () => setIsWriteModalOpen(false);

    const controlBar = useMemo(() => new ControlBar({
        FullscreenButton: true,
    }), []);

    useEffect(() => {
        confetti({
            particleCount: 200,
            spread: 60,
        });
    }, [refresh]);

    useEffect(() => {
        // 이미지 로드 및 projection 설정
        const loadImage = async () => {
            try {
                const image = await getImage(ino); // JSON 형식의 응답 받기
                const base64Data = image.fileContent; // JSON 응답에서 base64 문자열을 가져옵니다.
                const blobUrl = createBase64DataToBlob(base64Data); // Blob URL 생성
                setProjection(new EquirectProjection({ src: blobUrl })); // EquirectProjection에 Blob URL 설정
            } catch (error) {
                console.error('Error loading image:', error);
            }
        };

        loadImage();
    }, [ino]);


    const handleDownloadClick = async (e) => {
        e.preventDefault();

        try {
            const image = await getImage(ino); // JSON 형식의 응답 받기
            const base64Data = image.fileContent; // JSON 응답에서 base64 문자열을 가져옵니다.
            const blobUrl = createBase64DataToBlob(base64Data); // Blob URL 생성

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'image'; // 다운로드 파일 이름 설정
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl); // URL 객체 해제
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-center items-center mt-36">
                <div className="h-2/3 w-2/3">
                    {projection && (
                        <View360
                            className="is-16by9"
                            autoplay={true}
                            projection={projection}
                            plugins={[controlBar]}
                        />
                    )}
                </div>
            </div>
            <div className="flex justify-center m-10">
                <button
                    onClick={handleDownloadClick}
                    className="bg-gray-500 text-white px-6 py-4 rounded-lg hover:bg-gray-600 transition mx-2"
                >
                    ⬇️ 다운로드
                </button>
                <button
                    onClick={openWriteModal}
                    className="bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 transition mx-2"
                >
                    🖋️ 게시글 작성
                </button>
                <WriteModal isOpen={isWriteModalOpen} onClose={closeWriteModal} ino={ino}/>
            </div>
        </div>
    );
};

export default ResultComponent;