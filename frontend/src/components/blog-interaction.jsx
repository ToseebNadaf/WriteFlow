import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      blog_id,
      activity,
      activity: { total_likes, total_comments },
      author: {
        personal_info: { username: author_username },
      },
    },
    setBlog,
    islikedByUser,
    setLikedByUser,
    setCommentsWrapper,
  } = useContext(BlogContext);

  let {
    userAuth: { username, access_token },
  } = useContext(UserContext);

  useEffect(() => {
    if (access_token) {
      axios
        .post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/isliked-by-user`,
          { _id },
          {
            headers: { Authorization: access_token },
          }
        )
        .then(({ data: { result } }) => {
          setLikedByUser(Boolean(result));
        })
        .catch((err) => console.error("Error checking like status:", err));
    }
  }, [_id, access_token, setLikedByUser]);

  const handleLike = async () => {
    if (!access_token) {
      return toast.error("Please sign in to like this blog");
    }

    try {
      const newLikeStatus = !islikedByUser;
      setLikedByUser(newLikeStatus);

      const updatedTotalLikes = newLikeStatus
        ? total_likes + 1
        : total_likes - 1;

      setBlog((prevBlog) => ({
        ...prevBlog,
        activity: { ...prevBlog.activity, total_likes: updatedTotalLikes },
      }));

      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/like-blog`,
        { _id, islikedByUser },
        {
          headers: { Authorization: access_token },
        }
      );
    } catch (err) {
      setLikedByUser(islikedByUser);
      setBlog((prevBlog) => ({
        ...prevBlog,
        activity: { ...prevBlog.activity, total_likes },
      }));
      console.error("Error liking blog:", err);
      toast.error("Failed to update like. Please try again.");
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex gap-6 justify-between mt-10">
        <div className="flex gap-3 items-center">
          <button
            onClick={handleLike}
            className={
              "w-10 h-10 rounded-full flex items-center justify-center " +
              (islikedByUser ? "bg-red/20 text-red" : "bg-grey/80")
            }
          >
            <i
              className={
                "fi " + (islikedByUser ? "fi-sr-heart" : "fi-rr-heart")
              }
            ></i>
          </button>
          <p className="text-xl text-dark-grey">{total_likes}</p>

          <button
            onClick={() => setCommentsWrapper((preVal) => !preVal)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
          >
            <i className="fi fi-rr-comment-dots"></i>
          </button>
          <p className="text-xl text-dark-grey">{total_comments}</p>
        </div>

        <div className="flex gap-6 items-center">
          {username == author_username ? (
            <Link
              to={`/editor/${blog_id}`}
              className="underline hover:text-purple"
            >
              Edit
            </Link>
          ) : (
            ""
          )}

          <Link
            to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}
          >
            <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
          </Link>
        </div>
      </div>

      <hr className="border-grey mt-6" />
    </>
  );
};

export default BlogInteraction;
