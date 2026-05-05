"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
  seoTitle: string | null;
}

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    fetch(`/api/blog/${params.slug}`)
      .then((r) => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then((d: { post?: Post } | null) => { if (d?.post) { setPost(d.post); setLoading(false); } });
  }, [params?.slug]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
    </div>
  );

  if (notFound || !post) return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex flex-col items-center justify-center gap-4" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">المقال غير موجود</h1>
      <Link href="/blog" className="btn-primary">العودة للمدونة</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-violet-600 text-sm hover:underline flex items-center gap-1 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          العودة للمدونة
        </Link>

        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover rounded-3xl mb-8" />
        )}

        <h1 className="text-3xl font-black text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-gray-400 text-sm mb-8 pb-6 border-b border-violet-100">
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("ar-SA")}</span>}
          <span>{post.views.toLocaleString()} مشاهدة</span>
        </div>

        <div
          className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">جاهز لتنمية حساباتك؟</h3>
          <p className="text-violet-200 text-sm mb-4">انضم لآلاف المستخدمين الذين يثقون بـ SMM Pro</p>
          <Link href="/register" className="bg-white text-violet-600 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition inline-block">
            ابدأ الآن مجاناً
          </Link>
        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
