import { useState } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser } from 'react-icons/fi'
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import Header from '../components/Header';
import { ButtomClosePreview } from '../components/ButtomClosePreview';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean
}

export default function Home({ postsPagination, preview }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results)
  const [pagination, setPagination] = useState(postsPagination.next_page)
  
  function handleMorePost() {
    fetch(pagination)
      .then((response) => response.json())
      .then(data => {
        const newPost = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        })
        setPosts([...posts, ...newPost])
        setPagination(data.next_page)
      })
  }
  return (
    <>
      <Head>
        <title>Posts | spacetraveling.</title>
      </Head>

      <Header />
      <main className={commonStyles.containerContent}>
        {posts.map(post => (
          <div
            className={styles.postCard}
            key={post.uid}
          >
            <Link href={`/post/${post.uid}`}>
              <a >
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>

                <div className={styles.postCardFooter}>
                  <span>
                    <FiCalendar />
                    {format(new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </span>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </div>
        ))}

        {pagination && (
          <a
            className={styles.buttonMorePosts}
            onClick={() => handleMorePost()}
          >
            Carregar mais posts
          </a>
        )}

        {preview && (
          <ButtomClosePreview />
        )}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
    ref: previewData?.ref ?? null
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview
    },
    revalidate: 60 * 60 * 24, // 24 horas
  }
};
