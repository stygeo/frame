# Fake rails
module ActiveRecord
  class Base
    attr_accessor :resource_name, :attributes

    @@store = {
      "1" => {id: 1, title: 'bar title', student_id: 1234}
    }

    def initialize(attributes = {})
      self.resource_name = self.class.to_s.downcase.singularize
      self.attributes = attributes

      attributes.each do |key, value|
        self.class.send(:attr_accessor, key) unless self.respond_to? key

        self.instance_variable_set "@#{key}", value
      end

    end

    def title() @title end
    def title=(title)
      self.attributes[:title] = title

      @title = title
    end

    def save
      @@store[self.id.to_s] = self.attributes
    end

    def update_attributes attributes
      attributes.each do |key, val|
        self.attributes[key] = val
      end

      self.save
    end

    class << self
      def find(id)
        return self.new(@@store[id.to_s])
      end
    end
  end
end
