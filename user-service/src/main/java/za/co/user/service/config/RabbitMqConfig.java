package za.co.user.service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(EmailMessagingProperties.class)
public class RabbitMqConfig {

    @Bean
    Declarables emailMessagingTopology(EmailMessagingProperties properties) {
        DirectExchange exchange = new DirectExchange(properties.exchange(), true, false);
        DirectExchange deadLetterExchange = new DirectExchange(properties.deadLetterExchange(), true, false);

        Queue queue = QueueBuilder.durable(properties.queue())
                .deadLetterExchange(properties.deadLetterExchange())
                .deadLetterRoutingKey(properties.deadLetterRoutingKey())
                .build();
        Queue deadLetterQueue = QueueBuilder.durable(properties.deadLetterQueue()).build();

        Binding queueBinding = BindingBuilder.bind(queue)
                .to(exchange)
                .with(properties.routingKey());
        Binding deadLetterBinding = BindingBuilder.bind(deadLetterQueue)
                .to(deadLetterExchange)
                .with(properties.deadLetterRoutingKey());

        return new Declarables(
                exchange,
                deadLetterExchange,
                queue,
                deadLetterQueue,
                queueBinding,
                deadLetterBinding
        );
    }

    @Bean
    MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
