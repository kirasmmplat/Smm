"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((d: { posts?: Post[] }) => { setPosts(d.posts ?? []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">المدونة</h1>
          <p className="text-gray-500 text-lg">أحدث المقالات والنصائح في التسويق عبر السوشيال ميديا</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700">لا توجد مقالات بعد</h3>
            <p className="text-gray-400 mt-2">تابعنا لمعرفة أحدث النصائح والاستراتيجيات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white border border-violet-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-bold text-gray-900 text-lg group-hover:text-violet-600 transition">{post.title}</h2>
                  {post.excerpt && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ar-SA") : ""}
                    </span>
                    <span className="text-xs text-gray-400">{post.views.toLocaleString()} مشاهدة</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
