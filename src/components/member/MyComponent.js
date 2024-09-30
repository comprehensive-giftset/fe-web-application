import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import LoginModal from "../member/LoginModal";

import { getBoardListByMno } from "../../api/boardApi";
import { getThumbnail } from "../../api/imageApi";  
import useCustomMove from "../../hooks/useCustomMove";

const myBoardListInitState = {
    boardList: [],
    pageNumList: [],
    pageRequestDTO: null,
    prev: false,
    next: false,
    totalCount: 0,
    prevPage: 0,
    nextPage: 0,
    totalPage: 0,
    current: 0
};

const MyComponent = () => {
    const { page, size, refresh } = useCustomMove();
    const [myBoardList, setMyBoardList] = useState(myBoardListInitState);
    const [fetching, setFetching] = useState(false);
    const { isLogin, loginState } = useCustomLogin();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const [imageMap, setImageMap] = useState({}); // 각 게시글 이미지 상태

    const loadThumbnail = useCallback(async (ino) => {
        try {
            const image = await getThumbnail(ino);
            const base64Data = image.fileContent;
            return createBase64DataToBlob(base64Data); // Blob URL 반환
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    }, []);

    const createBase64DataToBlob = (base64Data) => {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        return URL.createObjectURL(blob); // Blob URL로 변환
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!loginState.mno) return; 
            setFetching(true);
            try {
                const responseData = await getBoardListByMno({ page, size }, loginState.mno);
                setMyBoardList({
                    ...myBoardListInitState,
                    boardList: responseData.dtoList || [] 
                });

                // 각 게시글의 이미지 불러오기
                const newImageMap = {};
                for (const myBoard of responseData.dtoList) { // myBoardList에서 responseData.dtoList로 수정
                    const image = await loadThumbnail(myBoard.ino);
                    newImageMap[myBoard.bno] = image;
                }
                setImageMap(newImageMap);

            } catch (error) {
                console.error("Error fetching board data:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [page, size, refresh, loginState.mno, loadThumbnail]); // loadThumbnail 추가

    const moveMain = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        moveMain();
    };

    useEffect(() => {
        if (!isLogin) {
            openModal();
        }
    }, [isLogin]);

    if (!isLogin) {
        return <LoginModal isOpen={isModalOpen} onClose={closeModal} />;
    }

    return (
        <div className="p-5 max-w-7xl mx-auto">
            {/* 상단 유저 정보 */}
            <div className="flex items-center mb-8 border-b pb-4 border-gray-300">
                <img
                    className="w-24 h-24 rounded-full mr-5"
                    src="https://via.placeholder.com/150"
                    alt="User Avatar"
                />
                <div>
                    <h2 className="text-2xl font-semibold">{loginState.nickname}</h2>
                    <p className="text-gray-600">{loginState.email}</p>
                </div>
            </div>

            {/* 자신이 작성한 게시글 목록 */}
            <div>
                <h3 className="text-xl font-medium mb-4">내 게시글</h3>
                {fetching ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBoardList.boardList.length === 0 ? (
                            <p>작성한 게시글이 없습니다.</p>
                        ) : (
                            myBoardList.boardList.map(board => (
                                <div key={board.bno} className="border rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition-shadow">
                                    <img
                                        className="w-full h-44 object-cover"
                                        src={imageMap[board.bno]}
                                        alt="Board Thumbnail"
                                    />
                                    <p className="p-4 text-center text-gray-800">{board.title}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* LoginModal */}
            <LoginModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
};

export default MyComponent;
