import React, { useEffect, useState, useCallback } from "react";
import BoardModal from "./BoardModal";
import BoardInfoModal from "../common/BoardInfoModal";
import ModifyModal from "../common/ModifyModal";
import { getBoardList, deleteBoard } from "../../api/boardApi";
import { getProfileThumbnail } from "../../util/profileImageUtil";
import LoginModal from "../../components/member/LoginModal";
import { getThumbnail } from "../../api/imageApi";
import { getHeartListByBno, postHeart, deleteHeart, findHnoByMnoBno } from "../../api/heartApi";
import useCustomMove from "../../hooks/useCustomMove";
import useCustomLogin from "../../hooks/useCustomLogin";
import PageComponent from "../common/PageComponent";
import { createBase64DataToBlob } from "../../util/imageUtil";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const initListState = {
    dtoList: [],
    pageNumList: [],
    pageRequestDTO: null,
    prev: false,
    next: false,
    totalCount: 0,
    prevPage: 0,
    nextPage: 0,
    totalPage: 0,
    current: 0,
    writerMno: 0,
    regDate: null,
    modDate: null,
};

const ListComponent = () => {
    const { page, size, refresh, moveToBoardList, moveToMyPage, setRefresh } = useCustomMove();
    const [serverData, setServerData] = useState(initListState);
    const [fetching, setFetching] = useState(false);
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(null);
    const [isBoardInfoModalOpen, setIsBoardInfoModalOpen] = useState(null);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(null);
    const [likedBoards, setLikedBoards] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [profileImageMap, setProfileImageMap] = useState({});
    const [imageMap, setImageMap] = useState({});

    const { isLogin, loginState } = useCustomLogin();

    const loadThumbnail = useCallback(async (ino) => {
        try {
            const image = await getThumbnail(ino);
            const base64Data = image.fileContent;
            return createBase64DataToBlob(base64Data);
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    }, []);

    const loadProfileImage = useCallback(async (mno) => {
        const thumbnailURL = await getProfileThumbnail(mno);
       return thumbnailURL;
    }, []);

    useEffect(() => {
        const fetchBoardAndLikes = async () => {
            setFetching(true);
            try {
                const data = await getBoardList({ page, size });
                data.writerMno = 0;
                setServerData(data);
    
                const newImageMap = {};
                const newProfileImageMap = {};
                for (const board of data.dtoList) {
                    newImageMap[board.bno] = await loadThumbnail(board.ino);
                    newProfileImageMap[board.bno] = await loadProfileImage(board.writerId);
                }
                setImageMap(newImageMap);
                setProfileImageMap(newProfileImageMap);
    
                if (loginState?.mno && data.dtoList.length > 0) {
                    const likesState = {};
                    for (const board of data.dtoList) {
                        const likedUsers = await getHeartListByBno(board.bno);
                        likesState[board.bno] = likedUsers.some(
                            like => like.memberId === loginState.mno
                        );
                    }
                    setLikedBoards(likesState);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setFetching(false);
            }
        };
    
        fetchBoardAndLikes();
    }, [loginState, page, size, refresh, loadThumbnail, loadProfileImage]);

    const handleBoardModalOpen = (bno) => {
        setIsBoardModalOpen(isBoardModalOpen === bno ? null : bno);
    };

    const handleBoardInfoModalOpen = (bno) => {
        setIsBoardInfoModalOpen(isBoardInfoModalOpen === bno ? null : bno);
    };

    const handleModifyBoard = async (bno) => {
        setIsModifyModalOpen(isModifyModalOpen === bno ? null : bno);
    };

    const handleDeleteBoard = async (bno) => {
        try {
            await deleteBoard(bno);
            alert('게시글이 삭제되었습니다.');
            setRefresh(!refresh);
        } catch (error) {
            console.error("Error deleting board:", error);
        }
    };

    const closeModifyModal = async () => {
        setIsModifyModalOpen(null);
        setRefresh(!refresh);
    }

    const handleLikeToggle = async (bno) => {
        if (!isLogin) {
            setIsLoginModalOpen(true);
            return;
        }

        try {
            if (!likedBoards[bno]) {
                await postHeart({
                    bno: bno,
                    memberId: loginState.mno,
                    memberEmail: loginState.email,
                });
                setLikedBoards((prevState) => ({
                    ...prevState,
                    [bno]: true,
                }));
            } else {
                const hno = await findHnoByMnoBno(loginState.mno, bno);
                if (hno) {
                    await deleteHeart(hno);
                    setLikedBoards((prevState) => ({
                        ...prevState,
                        [bno]: false,
                    }));
                }
            }
        } catch (error) {
            console.error("Error toggling heart:", error);
        } finally {
            setRefresh(!refresh);
        }
    };

    const handleMoveMypage = async (mno) => {
        moveToMyPage(mno, { page: 1 });
    };

    return (
        <div className="post-container flex justify-center mt-24">
            <div className="post-wrapper w-full sm:w-1/2 md:w-1/2 lg:w-2/5">
                {fetching && <p>Loading...</p>}

                {serverData.dtoList.map((board) => (
                    <div key={board.bno} className="post-item border-b border-gray-300 py-4 m-6 bg-white shadow-xl hover:shadow-2xl transition-shadow rounded-lg">
                        <div className="post-header flex justify-between items-center mb-3 px-4">
                            <div className="flex items-center cursor-pointer" onClick={() => handleMoveMypage(board.writerId)}>
                                <img
                                    className="bg-cover w-10 h-10 rounded-full mr-3"
                                    src={profileImageMap[board.bno]}
                                    alt="Cabbi"
                                    border="0"
                                />
                                <div>
                                    <p className="accent-gray-800">{board.writerNickname}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <p className="text-gray-600  text-sm">
                                    {board && (board.regDate === board.modDate
                                        ? `${formatDistanceToNow(new Date(board.regDate), {
                                            addSuffix: true,
                                            locale: ko
                                        })}`
                                        : `${formatDistanceToNow(new Date(board.modDate), {
                                            addSuffix: true,
                                            locale: ko
                                        })}(수정됨)`)}
                                </p>
                                {board.writerId === loginState.mno && (
                                    <button className="flex flex-col items-center justify-center text-gray-500 p-2 ml-4" onClick={() => handleBoardInfoModalOpen(board.bno)}>
                                        <span className="block w-1 h-1 bg-gray-500 rounded-full mb-1" />
                                        <span className="block w-1 h-1 bg-gray-500 rounded-full mb-1" />
                                        <span className="block w-1 h-1 bg-gray-500 rounded-full" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="post-body"
                            onClick={() => handleBoardModalOpen(board.bno)}>
                            <img
                                className="w-full h-auto mb-3 cursor-pointer object-cover"
                                style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                                src={imageMap[board.bno] || "https://via.placeholder.com/800x600"}
                                alt="Post Media"
                            />
                            <p className="px-4 cursor-pointer font-semibold text-xl md:text-xl">
                                {board.title}
                                {board.regData}
                            </p>
                            <p className="px-4 cursor-pointer text-sm md:text-base">
                                {board.content}
                            </p>
                        </div>

                        <div className="post-footer flex justify-between items-center mt-3 px-4">
                            <div>
                                <button className="mr-3 cursor-pointer" onClick={() => handleLikeToggle(board.bno)}>
                                    {likedBoards[board.bno] ? "❤️" : "🤍"} {board.heartCount}
                                </button>
                                <button className="cursor-pointer" onClick={() => handleBoardModalOpen(board.bno)}>
                                    💬 {board.replyCount}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <PageComponent serverData={serverData} movePage={moveToBoardList} />

                <BoardInfoModal
                    isOpen={isBoardInfoModalOpen !== null}
                    onClose={() => setIsBoardInfoModalOpen(null)}
                    bno={isBoardInfoModalOpen}
                    onModify={handleModifyBoard}
                    onDelete={handleDeleteBoard}
                />

                <BoardModal
                    isOpen={isBoardModalOpen !== null}
                    onClose={() => setIsBoardModalOpen(null)}
                    bno={isBoardModalOpen}
                />

                <ModifyModal
                    isOpen={isModifyModalOpen !== null}
                    onClose={() => closeModifyModal()}
                    bno={isModifyModalOpen}
                />

                {isLoginModalOpen && (  // 로그인 모달 열기
                    <LoginModal
                        isOpen={isLoginModalOpen}
                        onClose={() => setIsLoginModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ListComponent;
