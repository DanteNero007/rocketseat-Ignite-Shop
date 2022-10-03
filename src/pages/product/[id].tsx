import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/future/image';
import { useRouter } from 'next/router';
import Stripe from 'stripe';
import { stripe } from '../../lib/stripe';
import { ImageContainer, ProductContainer, ProductDetails } from '../../styles/pages/product';
import axios from 'axios';
import Head from 'next/head';

interface ProductsProps{
    product:{
      id: string;
    name: string;
    imageUrl: string;
    price: string;
    description: string;
    defaultPriceId:string;
    }
  }

export default function Product({ product }: ProductsProps){
    const [isCreateCheckoutSession, setIsCreateCheckoutSession] = useState(false);
    const { isFallback } = useRouter()
    if(isFallback){
        return( <p>Loading...</p> )
    } 
    
    
   async function handleBuyProduct(){
        try{
            setIsCreateCheckoutSession(true);
            const response = await axios.post('/api/checkout',{
                priceId: product.defaultPriceId
            })
            const { checkoutUrl } = response.data;
            window.location.href= checkoutUrl;

        }catch(err){
            setIsCreateCheckoutSession(false);
            alert('Falha ao redireionar o checkout');
           
        }
    }
    
    return(
        <>
        <Head> 
            <title>{product.name}| Ignite Shop</title> 
        </Head>
        <ProductContainer>
            <ImageContainer>
                <Image src={product.imageUrl} alt={product.name}height={520} width={480} />

            </ImageContainer>
            
            <ProductDetails>
                <h1>{product.name}</h1>
                <span>{product.price}</span>
                <p>{product.description}</p>
                <button disabled={isCreateCheckoutSession} onClick={handleBuyProduct} >Comprar Agora</button>
            </ProductDetails>

        </ProductContainer>
        </>
    )
}

export const getStaticPaths:GetStaticPaths = () =>{
    return{
        paths:[
            //carregar os items mais vendidos ou [] gerar statico conforme o usuario escolhe
            {params:{id:'prod_MUKSHwjLiIv6Is'}}
        ],
        fallback: true,
    }
}

export const getStaticProps: GetStaticProps<any, {id: string}> = async ({ params}) =>{
    
    const productId = params.id;
    const product = await stripe.products.retrieve(productId,{
        expand: ['default_price'],
    });
    const price = product.default_price as Stripe.Price

    return {
        props:{
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                url: product.url,
                price: new Intl.NumberFormat('pt-BR',{
                  style: 'currency',
                  currency: 'BRL',
                }).format(price.unit_amount / 100),
                description: product.description,
                defaultPriceId: price.id,
              }
        },
        revalidate: 60 * 60 * 1,
    }
}