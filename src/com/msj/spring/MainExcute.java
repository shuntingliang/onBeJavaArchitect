package com.msj.spring;

import com.msj.spring.entity.Architect;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class MainExcute {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext ac = new ClassPathXmlApplicationContext();
        ac.setConfigLocation("factorybeantest.xml");
        ac.refresh();
        //getBean的时候才会去getObject
        ac.getBean("architect", Architect.class);
        /**
         * 总结：
         * 1、BeanFactory是接口，提供了OC容器最基本的形式，给具体的IOC容器的实现提供了规范，FactoryBean也是接口，
         * 为IOC容器中Bean的实现提供了更加灵活的方式，FactoryBean在IOC容器的基础上给Bean的实现加上了一个简单工厂
         * 模式和装饰模式(如果想了解装饰模式参考：修饰者模式(装饰者模式，Decoration) 我们可以在getObject()方法中
         * 灵活配置。其实在Spring源码中有很多FactoryBean的实现类.
         * 2、BeanFactory是个Factory，也就是IOC容器或对象工厂，FactoryBean是个Bean。在Spring中，所有的Bean都是
         * 由BeanFactory(也就是IOC容器)来进行管理的。但对FactoryBean而言，这个Bean不是简单的Bean，而是一个能生产
         * 或者修饰对象生成的工厂Bean,它的实现与设计模式中的工厂模式和修饰器模式类似
         */
    }
}
