import jwtAxios from "../util/jwtUtil";
import axios from "axios";
import API_SERVER_HOST from "./apiConfig";

const prefix = `${API_SERVER_HOST}/boards`;

export const postBoard = async (boardData) => {
    const formData = new FormData();
    formData.append('title', boardData.title); 
    formData.append('content', boardData.content);
    formData.append('ino', boardData.ino);
    formData.append('writerId', boardData.writerId);
    formData.append('writerEmail', boardData.writerEmail);
    formData.append('writerNickname', boardData.writerNickname);

    try {
        const res = await jwtAxios.post(`${prefix}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    } catch (error) {
        return { error: error.response ? error.response.data : error.message };
    }
};

export const getBoard = async (bno) => {
    const res = await axios.get(`${prefix}/${bno}`);

    return res.data
}

export const getBoardList = async (pageParam) => {
    const { page, size } = pageParam;

    try {
        const res = await axios.get(`${prefix}/list`, { params: { page, size } });
        return res.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

export const getBoardListByMno = async (pageParam, mno) => {
    const { page, size } = pageParam;

    try {
        const res = await axios.get(`${prefix}/list/member/${mno}`, { params: { page, size } });
        return res.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

export const putBoard = async (bno, boardData) => {
    const formData = new FormData();
    formData.append('title', boardData.title); 
    formData.append('content', boardData.content);
    formData.append('writerId', boardData.writerId);
    formData.append('writerEmail', boardData.writerEmail);

    const res = await jwtAxios.put(`${prefix}/${bno}`, formData);

    return res.data
}

export const deleteBoard = async (bno) => {
    try {
        const res = await jwtAxios.delete(`${prefix}/${bno}`);
        return res.data;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};