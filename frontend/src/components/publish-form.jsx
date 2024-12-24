import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { EditorContext } from "../pages/editor";
import Tag from "./tags";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

const PublishForm = () => {
  const CHARACTER_LIMIT = 200;
  const TAG_LIMIT = 10;

  const { blog_id } = useParams();

  const {
    blog,
    blog: { banner, title, tags, des, content },
    setEditorState,
    setBlog,
  } = useContext(EditorContext);

  const {
    userAuth: { access_token },
  } = useContext(UserContext);

  const navigate = useNavigate();

  const handleCloseEvent = () => {
    setEditorState("editor");
  };

  const handleBlogTitleChange = (e) => {
    setBlog({ ...blog, title: e.target.value });
  };

  const handleBlogDesChange = (e) => {
    setBlog({ ...blog, des: e.target.value });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const tag = e.target.value.trim();
      if (tags.length < TAG_LIMIT && tag && !tags.includes(tag)) {
        setBlog({ ...blog, tags: [...tags, tag] });
        e.target.value = "";
      } else if (tags.length >= TAG_LIMIT) {
        toast.error(`You can add a maximum of ${TAG_LIMIT} tags.`);
      }
    }
  };

  const publishBlog = async (e) => {
    if (e.target.className.includes("disable")) return;

    if (!title.trim()) {
      toast.error("Write a blog title before publishing.");
      return;
    }

    if (!des.trim() || des.length > CHARACTER_LIMIT) {
      toast.error(`Write a description within ${CHARACTER_LIMIT} characters.`);
      return;
    }

    if (!tags.length) {
      toast.error("Enter at least one tag to help us rank your blog.");
      return;
    }

    const loadingToast = toast.loading("Publishing...");
    e.target.classList.add("disable");

    const blogObj = {
      title,
      banner,
      des,
      content,
      tags,
      draft: false,
    };

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/create-blog`,
        { ...blogObj, id: blog_id },
        {
          headers: {
            Authorization: access_token,
          },
        }
      );
      toast.dismiss(loadingToast);
      toast.success("Published");
      setTimeout(() => navigate("/dashboard/blogs"), 500);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || "Failed to publish blog.");
    } finally {
      e.target.classList.remove("disable");
    }
  };

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-[16rem] lg:gap-4">
        <Toaster />

        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>

        <div className="max-w-[550px] center">
          <p className="text-dark-grey mb-1">Preview</p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} alt="Blog banner" />
          </div>
          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
            {title || "Untitled Blog"}
          </h1>
          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {des || "No description provided."}
          </p>
        </div>

        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
          <input
            type="text"
            placeholder="Blog Title"
            value={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />

          <p className="text-dark-grey mb-2 mt-9">Short Description</p>
          <textarea
            maxLength={CHARACTER_LIMIT}
            value={des}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleBlogDesChange}
            onKeyDown={handleTitleKeyDown}
          ></textarea>

          <p className="mt-1 text-dark-grey text-sm text-right">
            {CHARACTER_LIMIT - des.length} characters left
          </p>

          <p className="text-dark-grey mb-2 mt-9">Topics (Tags)</p>
          <div className="relative input-box pl-2 py-2 pb-4">
            <input
              type="text"
              placeholder="Add Tags"
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
            {tags.map((tag, i) => (
              <Tag tag={tag} tagIndex={i} key={i} />
            ))}
          </div>

          <p className="mt-1 mb-4 text-dark-grey text-right">
            {TAG_LIMIT - tags.length} Tags left
          </p>

          <button className="btn-dark px-8" onClick={publishBlog}>
            Publish
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
